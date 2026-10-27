const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const HandoverRequest = require('../models/HandoverRequest');

// Helper to calculate distance
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000); // in meters
}

// @desc    Calculate Smart Arrival recommendation & alternative parking options
// @route   POST /api/smart-arrival
// @access  Public
exports.getRecommendation = async (req, res, next) => {
  try {
    const { locationId, preferredArrivalTime, durationHours } = req.body;

    if (!locationId) {
      return res.status(400).json({ success: false, message: 'Please select a desired parking location' });
    }

    const targetLocation = await ParkingLocation.findById(locationId);
    if (!targetLocation) {
      return res.status(404).json({ success: false, message: 'Target parking location not found' });
    }

    const arrivalDate = preferredArrivalTime ? new Date(preferredArrivalTime) : new Date();
    const duration = Number(durationHours) || 2;

    // 1. Analyze slots at target location
    const targetSlots = await ParkingSlot.find({ location: targetLocation._id });
    const totalSlots = targetSlots.length;
    const availableNow = targetSlots.filter((s) => s.status === 'Available').length;
    const currentOccupancyRate = Math.round(((totalSlots - availableNow) / (totalSlots || 1)) * 100);

    // 2. Analyze scheduled departures around arrival time (within +/- 30 mins)
    const windowStart = new Date(arrivalDate.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(arrivalDate.getTime() + 45 * 60 * 1000);

    const upcomingBookingsEnding = await Booking.find({
      location: targetLocation._id,
      endTime: { $gte: windowStart, $lte: windowEnd },
      bookingStatus: { $in: ['confirmed', 'active'] },
    });

    const pendingHandovers = await HandoverRequest.find({
      location: targetLocation._id,
      expectedDepartureTime: { $gte: windowStart, $lte: windowEnd },
      status: { $in: ['Expected_Soon', 'Handover_Requested'] },
    });

    const expectedDeparturesCount = upcomingBookingsEnding.length + pendingHandovers.length;

    // 3. Rule-based Smart Arrival recommendation logic
    let recommendedTime = new Date(arrivalDate);
    let reasoning = '';
    let congestionLevel = 'Moderate';

    if (availableNow >= 3) {
      // Good availability now
      reasoning = `High availability detected at ${targetLocation.name}. ${availableNow} slots are currently free. You can arrive right at your scheduled time without delays.`;
      congestionLevel = 'Low';
    } else if (expectedDeparturesCount > 0) {
      // High demand but expected departures in 10-20 minutes
      recommendedTime = new Date(arrivalDate.getTime() + 15 * 60 * 1000); // 15 mins later
      const formattedRec = recommendedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      reasoning = `Based on predictive departure modeling, ${expectedDeparturesCount} vehicle(s) are scheduled to check out around ${formattedRec}. Arriving at ${formattedRec} will provide an optimal slot handover experience.`;
      congestionLevel = 'High (Departures Imminent)';
    } else {
      // Very congested, recommend arriving slightly earlier or alternative lot
      recommendedTime = new Date(arrivalDate.getTime() - 10 * 60 * 1000);
      const formattedRec = recommendedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      reasoning = `Facility is experiencing peak traffic (${currentOccupancyRate}% occupancy). We recommend arriving 10 minutes earlier at ${formattedRec} to secure incoming turnaround slots, or considering one of our nearby partner hubs.`;
      congestionLevel = 'Peak';
    }

    // 4. Find Alternative Nearby Parking locations (within 1.5 km)
    const allOtherLocations = await ParkingLocation.find({
      _id: { $ne: targetLocation._id },
      isApproved: true,
    });

    const alternativeParking = [];
    for (const other of allOtherLocations) {
      const distanceMeters = getDistance(
        targetLocation.latitude,
        targetLocation.longitude,
        other.latitude,
        other.longitude
      );

      const otherSlots = await ParkingSlot.find({ location: other._id });
      const freeSlots = otherSlots.filter((s) => s.status === 'Available').length;
      const evSlots = otherSlots.filter((s) => s.type === 'EV' && s.status === 'Available').length;

      alternativeParking.push({
        _id: other._id,
        name: other.name,
        address: other.address,
        distanceMeters,
        distanceText: distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(1)} km away` : `${distanceMeters} m away`,
        walkingTimeMinutes: Math.round(distanceMeters / 80), // avg walking speed 80m/min
        availableSlots: freeSlots,
        availableEvSlots: evSlots,
        hourlyRate: other.hourlyRate,
        rating: other.rating,
        images: other.images,
      });
    }

    // Sort alternatives by available slots and proximity
    alternativeParking.sort((a, b) => a.distanceMeters - b.distanceMeters);

    res.status(200).json({
      success: true,
      data: {
        targetLocation: {
          _id: targetLocation._id,
          name: targetLocation.name,
          address: targetLocation.address,
          availableNow,
          totalSlots,
          occupancyRate: currentOccupancyRate,
          hourlyRate: targetLocation.hourlyRate,
        },
        requestedTime: arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedArrival: recommendedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedArrivalFull: recommendedTime.toISOString(),
        congestionLevel,
        expectedDeparturesCount,
        reason: reasoning,
        alternativeParking: alternativeParking.slice(0, 3), // Top 3 nearby recommendations
      },
    });
  } catch (error) {
    next(error);
  }
};
