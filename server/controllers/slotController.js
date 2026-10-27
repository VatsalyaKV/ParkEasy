const ParkingSlot = require('../models/ParkingSlot');
const ParkingLocation = require('../models/ParkingLocation');
const { syncLocationAvailability } = require('../services/parkingState');

// @desc    Get all slots for a parking location
// @route   GET /api/parking/:id/slots
// @access  Public
exports.getSlotsByLocation = async (req, res, next) => {
  try {
    const { floor, type, status } = req.query;
    let query = { location: req.params.id };

    if (floor) query.floor = floor;
    if (type) query.type = type;
    if (status) query.status = status;

    const slots = await ParkingSlot.find(query)
      .sort({ floor: 1, slotNumber: 1 })
      .populate('currentOccupant', 'name email');

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a single slot
// @route   POST /api/slots
// @access  Private (Owner/Admin)
exports.createSlot = async (req, res, next) => {
  try {
    const { location, slotNumber, floor, type, evChargerType, pricingMultiplier } = req.body;
    const parkingLocation = await ParkingLocation.findById(location);
    if (!parkingLocation) {
      return res.status(404).json({ success: false, message: 'Parking location not found' });
    }
    if (req.user.role !== 'admin' && parkingLocation.owner?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only manage slots in your own parking facilities.' });
    }

    // Check duplicate
    const existing = await ParkingSlot.findOne({ location, slotNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: `Slot ${slotNumber} already exists in this location` });
    }

    const slot = await ParkingSlot.create({
      location,
      slotNumber,
      floor: floor || 'Ground Floor',
      type: type || 'Regular',
      evChargerType: type === 'EV' ? (evChargerType || 'CCS2 Fast DC (50 kW)') : 'None',
      pricingMultiplier: Number(pricingMultiplier) || 1.0,
      status: 'Available',
    });

    // Update location total slots count
    await ParkingLocation.findByIdAndUpdate(location, { $inc: { totalSlots: 1, availableSlots: 1 } });

    // Socket.io real-time broadcast if initialized
    if (req.io) {
      req.io.to(`location_${location}`).emit('slotAdded', slot);
    }

    res.status(201).json({
      success: true,
      message: 'Slot created successfully',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update slot status or details
// @route   PUT /api/slots/:id
// @access  Private (Owner/Admin)
exports.updateSlot = async (req, res, next) => {
  try {
    const { status, type, expectedFreeTime, pricingMultiplier, evChargerType } = req.body;
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Parking slot not found' });

    const parkingLocation = await ParkingLocation.findById(slot.location);
    if (req.user.role !== 'admin' && (!parkingLocation || parkingLocation.owner?.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only manage slots in your own parking facilities.' });
    }

    if (status && !['Available', 'Maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Reserved, Occupied and Handover states are system-controlled and cannot be changed manually.',
      });
    }
    if (status === 'Maintenance' && slot.status !== 'Available') {
      return res.status(409).json({ success: false, message: 'A slot must be physically available before it can be placed into maintenance.' });
    }

    if (type) slot.type = type;
    if (expectedFreeTime !== undefined) slot.expectedFreeTime = expectedFreeTime;
    if (pricingMultiplier !== undefined) slot.pricingMultiplier = Number(pricingMultiplier);
    if (evChargerType) slot.evChargerType = evChargerType;
    if (status) slot.status = status;
    if (type === 'EV' && !slot.evChargerType) slot.evChargerType = 'CCS2 Fast DC (50 kW)';

    await slot.save();
    await syncLocationAvailability(slot.location);

    req.io?.to(`location_${slot.location}`).emit('slotStatusChanged', {
      slotId: slot._id, locationId: slot.location, slotNumber: slot.slotNumber,
      newStatus: slot.status, expectedFreeTime: slot.expectedFreeTime,
      type: slot.type, availabilitySource: slot.availabilitySource,
    });

    res.status(200).json({ success: true, message: 'Slot updated successfully', data: slot });
  } catch (error) { next(error); }
};

// @desc    Bulk generate parking slots for an owner's location
// @route   POST /api/slots/bulk
// @access  Private (Owner/Admin)
exports.bulkGenerateSlots = async (req, res, next) => {
  try {
    const { locationId, floor, count, prefix, evCount } = req.body;
    const parkingLocation = await ParkingLocation.findById(locationId);
    if (!parkingLocation) {
      return res.status(404).json({ success: false, message: 'Parking location not found' });
    }
    if (req.user.role !== 'admin' && parkingLocation.owner?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only manage slots in your own parking facilities.' });
    }

    const slotCount = Number(count) || 10;
    const numEV = Number(evCount) || 2;
    const pfx = prefix || (floor === 'Basement 1' ? 'B1-' : floor === '1st Floor' ? 'F1-' : 'G-');

    const createdSlots = [];
    for (let i = 1; i <= slotCount; i++) {
      const slotNum = `${pfx}${String(i).padStart(2, '0')}`;
      const isEV = i <= numEV;

      // Skip if already exists
      const existing = await ParkingSlot.findOne({ location: locationId, slotNumber: slotNum });
      if (!existing) {
        createdSlots.push({
          location: locationId,
          slotNumber: slotNum,
          floor: floor || 'Ground Floor',
          type: isEV ? 'EV' : 'Regular',
          evChargerType: isEV ? 'CCS2 Fast DC (50 kW)' : 'None',
          status: 'Available',
        });
      }
    }

    if (createdSlots.length > 0) {
      await ParkingSlot.insertMany(createdSlots);
      await ParkingLocation.findByIdAndUpdate(locationId, {
        $inc: { totalSlots: createdSlots.length, availableSlots: createdSlots.length },
      });
    }

    res.status(201).json({
      success: true,
      message: `Generated ${createdSlots.length} slots successfully`,
      data: createdSlots,
    });
  } catch (error) {
    next(error);
  }
};
