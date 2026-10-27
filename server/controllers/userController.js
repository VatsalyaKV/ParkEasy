const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

// @desc    Get user profile details
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const vehicles = await Vehicle.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        user,
        vehicles,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatar && { avatar }),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's registered vehicles
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a vehicle to user's garage
// @route   POST /api/vehicles
// @access  Private
exports.addVehicle = async (req, res, next) => {
  try {
    const { licensePlate, make, model, type, color, isEV, isDefault } = req.body;

    // If marked default, unset other defaults
    if (isDefault) {
      await Vehicle.updateMany({ user: req.user.id }, { isDefault: false });
    }

    // Check if this is the first vehicle, make it default automatically
    const existingCount = await Vehicle.countDocuments({ user: req.user.id });

    const vehicle = await Vehicle.create({
      user: req.user.id,
      licensePlate: licensePlate.toUpperCase().trim(),
      make,
      model,
      type: type || (isEV ? 'EV' : 'Car'),
      color: color || 'White',
      isEV: isEV || type === 'EV',
      isDefault: isDefault || existingCount === 0,
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, user: req.user.id });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized' });
    }

    await vehicle.deleteOne();

    // If deleted vehicle was default, make the latest one default
    if (vehicle.isDefault) {
      const remaining = await Vehicle.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set vehicle as default
// @route   PUT /api/vehicles/:id/default
// @access  Private
exports.setDefaultVehicle = async (req, res, next) => {
  try {
    await Vehicle.updateMany({ user: req.user.id }, { isDefault: false });
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isDefault: true },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Default vehicle updated',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics for user
// @route   GET /api/users/dashboard-stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const activeBooking = await Booking.findOne({
      user: userId,
      bookingStatus: { $in: ['confirmed', 'active'] },
    })
      .populate('location', 'name address images hourlyRate')
      .populate('slot', 'slotNumber floor type')
      .populate('vehicle', 'licensePlate make model isEV');

    const totalBookings = await Booking.countDocuments({ user: userId });

    const completedBookings = await Booking.find({
      user: userId,
      bookingStatus: 'completed',
    });

    const hoursParked = completedBookings.reduce((acc, curr) => acc + (curr.durationHours || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        activeBooking,
        totalBookings,
        hoursParked: Math.round(hoursParked * 10) / 10,
        ecoPoints: user.ecoPoints || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
