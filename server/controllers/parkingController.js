const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');

// Helper to calculate distance between two coordinates in km (Haversine formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// @desc    Get all parking locations with filtering & distance calculation
// @route   GET /api/parking
// @access  Public
exports.getParkingLocations = async (req, res, next) => {
  try {
    const { keyword, city, evOnly, maxPrice, userLat, userLng, limit } = req.query;

    let query = { isApproved: true };

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { address: { $regex: keyword, $options: 'i' } },
        { city: { $regex: keyword, $options: 'i' } },
        { state: { $regex: keyword, $options: 'i' } },
        { postalCode: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (maxPrice) {
      query.hourlyRate = { $lte: Number(maxPrice) };
    }

    let locations = await ParkingLocation.find(query).populate('owner', 'name email phone');

    // Calculate live available slots for each location
    const locationsWithSlots = await Promise.all(
      locations.map(async (loc) => {
        const slots = await ParkingSlot.find({ location: loc._id });
        const availableSlots = slots.filter((s) => s.status === 'Available').length;
        const evSlots = slots.filter((s) => s.type === 'EV').length;
        const availableEvSlots = slots.filter((s) => s.type === 'EV' && s.status === 'Available').length;

        // Calculate distance if user coords provided
        let distance = null;
        if (Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng))) {
          distance = getDistanceFromLatLonInKm(
            Number(userLat),
            Number(userLng),
            loc.latitude,
            loc.longitude
          );
        }

        const locObj = loc.toObject();
        locObj.totalSlots = slots.length || loc.totalSlots;
        locObj.availableSlots = availableSlots;
        locObj.evSlots = evSlots;
        locObj.availableEvSlots = availableEvSlots;
        locObj.distance = distance;
        locObj.walkingTimeMinutes = distance != null ? Math.max(1, Math.round((distance * 1000) / 80)) : null;

        return locObj;
      })
    );

    // Apply EV only filter if requested
    let results = locationsWithSlots;
    if (evOnly === 'true') {
      results = results.filter((l) => l.evSlots > 0);
    }

    // Sort by distance or rating
    if (Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng))) {
      results.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
    } else {
      results.sort((a, b) => (b.availableSlots || 0) - (a.availableSlots || 0));
    }

    if (limit) {
      results = results.slice(0, Number(limit));
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single parking location details
// @route   GET /api/parking/:id
// @access  Public
exports.getParkingLocationById = async (req, res, next) => {
  try {
    const location = await ParkingLocation.findById(req.params.id).populate('owner', 'name email phone');

    if (!location) {
      return res.status(404).json({ success: false, message: 'Parking location not found' });
    }

    const slots = await ParkingSlot.find({ location: location._id });
    const availableSlots = slots.filter((s) => s.status === 'Available').length;
    const occupiedSlots = slots.filter((s) => s.status === 'Occupied').length;
    const reservedSlots = slots.filter((s) => s.status === 'Reserved').length;
    const evSlots = slots.filter((s) => s.type === 'EV').length;

    const locObj = location.toObject();
    locObj.totalSlots = slots.length;
    locObj.availableSlots = availableSlots;
    locObj.occupiedSlots = occupiedSlots;
    locObj.reservedSlots = reservedSlots;
    locObj.evSlots = evSlots;

    res.status(200).json({
      success: true,
      data: locObj,
      slotsPreview: slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new parking location (Owner / Admin)
// @route   POST /api/parking
// @access  Private (Owner/Admin)
exports.createParkingLocation = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'description', 'address', 'city', 'state', 'postalCode',
      'latitude', 'longitude', 'hourlyRate', 'evHourlyRate',
      'evIncentiveDiscount', 'totalSlots', 'amenities', 'operatingHours',
      'websiteUrl', 'images', 'isOpen',
    ];
    const locationData = Object.fromEntries(
      allowedFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    // A newly created facility always belongs to the authenticated creator.
    locationData.owner = req.user._id;

    const location = await ParkingLocation.create(locationData);

    // Auto create default slots if totalSlots provided
    const count = Number(req.body.totalSlots) || 12;
    const slots = [];
    for (let i = 1; i <= count; i++) {
      const isEV = i <= Math.ceil(count * 0.25); // 25% EV slots
      const isAccessible = i === count;
      slots.push({
        location: location._id,
        slotNumber: isEV ? `EV-${String(i).padStart(2, '0')}` : `A-${String(i).padStart(2, '0')}`,
        floor: 'Ground Floor',
        type: isEV ? 'EV' : isAccessible ? 'Accessible' : 'Regular',
        status: 'Available',
        evChargerType: isEV ? 'CCS2 Fast DC (50 kW)' : 'None',
      });
    }
    await ParkingSlot.insertMany(slots);

    res.status(201).json({
      success: true,
      message: 'Parking location created with automated slot layout',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update parking location
// @route   PUT /api/parking/:id
// @access  Private (Owner/Admin)
exports.updateParkingLocation = async (req, res, next) => {
  try {
    let location = await ParkingLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Parking location not found' });
    }

    // Verify ownership if not admin
    if (req.user.role !== 'admin' && (!location.owner || location.owner.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this location' });
    }

    const allowedFields = [
      'name', 'description', 'address', 'city', 'state', 'postalCode',
      'latitude', 'longitude', 'hourlyRate', 'evHourlyRate', 'evIncentiveDiscount',
      'amenities', 'operatingHours', 'websiteUrl', 'images', 'isOpen'
    ];
    const updates = Object.fromEntries(
      allowedFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    // owner, approval, slot counts and system-managed fields are never client-writable.
    location = await ParkingLocation.findByIdAndUpdate(req.params.id, { $set: updates }, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Parking location updated successfully',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete parking location
// @route   DELETE /api/parking/:id
// @access  Private (Owner/Admin)
exports.deleteParkingLocation = async (req, res, next) => {
  try {
    const location = await ParkingLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Parking location not found' });
    }

    if (req.user.role !== 'admin' && (!location.owner || location.owner.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this location' });
    }

    await ParkingSlot.deleteMany({ location: location._id });
    await location.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Parking location and associated slots deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
