const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const EcoReward = require('../models/EcoReward');
const crypto = require('crypto');

// @desc    Get EcoPark summary for user
// @route   GET /api/ecopark
// @access  Private (User)
exports.getEcoParkSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Get user's vehicles to check for EV status
    const vehicles = await Vehicle.find({ user: userId });
    const evVehicles = vehicles.filter((v) => v.isEV || v.type === 'EV');
    const hasEV = evVehicles.length > 0;

    // Get Eco Rewards history
    const rewards = await EcoReward.find({ user: userId }).sort({ createdAt: -1 });

    const totalPointsEarned = rewards.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
    const totalPointsSpent = rewards.reduce((sum, r) => sum + (r.pointsSpent || 0), 0);
    const totalCarbonOffsetKg = rewards.reduce((sum, r) => sum + (r.carbonOffsetKg || 0), 0);

    // Get EV-friendly locations with charging infrastructure
    const locations = await ParkingLocation.find({ isApproved: true });
    const evLocations = [];

    for (const loc of locations) {
      const evSlots = await ParkingSlot.find({ location: loc._id, type: 'EV' });
      const availableEvSlots = evSlots.filter((s) => s.status === 'Available').length;

      if (evSlots.length > 0) {
        evLocations.push({
          _id: loc._id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          hourlyRate: loc.hourlyRate,
          evHourlyRate: loc.evHourlyRate || loc.hourlyRate - 10,
          evIncentiveDiscount: loc.evIncentiveDiscount || 20,
          totalEvSlots: evSlots.length,
          availableEvSlots,
          chargerTypes: [...new Set(evSlots.map((s) => s.evChargerType).filter(Boolean))],
          images: loc.images,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ecoPoints: user.ecoPoints || 0,
        totalPointsEarned,
        totalPointsSpent,
        totalCarbonOffsetKg: Math.round(totalCarbonOffsetKg * 10) / 10,
        hasEV,
        evVehicles,
        evLocations,
        availableRewards: [
          {
            id: 'RWD-1',
            title: '₹25 Parking Discount Voucher',
            pointsRequired: 100,
            description: 'Get an instant ₹25 deduction on your next reservation.',
          },
          {
            id: 'RWD-2',
            title: '1 Hour Free EV Fast Charging',
            pointsRequired: 250,
            description: 'Redeem at any ParkEasy CCS2 50kW EV charging bay.',
          },
          {
            id: 'RWD-3',
            title: 'Full Day Green Pass (50% Off)',
            pointsRequired: 500,
            description: 'Enjoy 50% off a full 24-hour smart parking session.',
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's eco reward history
// @route   GET /api/ecopark/rewards
// @access  Private (User)
exports.getRewardHistory = async (req, res, next) => {
  try {
    const rewards = await EcoReward.find({ user: req.user.id })
      .populate('booking', 'bookingReference startTime finalAmount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rewards.length,
      data: rewards,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Redeem eco points for a reward
// @route   POST /api/ecopark/redeem
// @access  Private (User)
exports.redeemReward = async (req, res, next) => {
  try {
    const { rewardId, pointsRequired, title } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const required = Number(pointsRequired) || 100;

    if (user.ecoPoints < required) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Eco Points. You have ${user.ecoPoints}, but need ${required}.`,
      });
    }

    user.ecoPoints -= required;
    await user.save();

    const voucherCode = `ECO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const reward = await EcoReward.create({
      user: userId,
      pointsSpent: required,
      reason: `Redeemed reward: ${title || 'Parking Reward'} (Voucher Code: ${voucherCode})`,
    });

    res.status(200).json({
      success: true,
      message: `Congratulations! You redeemed '${title}'. Use voucher code ${voucherCode}.`,
      voucherCode,
      remainingPoints: user.ecoPoints,
      reward,
    });
  } catch (error) {
    next(error);
  }
};
