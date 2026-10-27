const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// @desc    Get master system analytics and KPIs for Admin
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalLocations = await ParkingLocation.countDocuments();
    const totalSlots = await ParkingSlot.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeReservations = await Booking.countDocuments({ bookingStatus: { $in: ['confirmed', 'active'] } });

    const payments = await Payment.find({ status: 'success' });
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const availableSlots = await ParkingSlot.countDocuments({ status: 'Available' });
    const occupiedSlots = await ParkingSlot.countDocuments({ status: 'Occupied' });
    const reservedSlots = await ParkingSlot.countDocuments({ status: 'Reserved' });
    const evSlots = await ParkingSlot.countDocuments({ type: 'EV' });

    // Recent platform bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('location', 'name')
      .populate('slot', 'slotNumber')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalOwners,
        totalLocations,
        totalSlots,
        totalBookings,
        totalRevenue,
        activeReservations,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        evSlots,
        occupancyRate: totalSlots > 0 ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100) : 0,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (with search and status toggle)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const query = {};
    query.role = role ? role : { $in: ['user', 'owner'] };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);
    res.status(200).json({ success: true, count: users.length, total, page, limit, pages: Math.ceil(total / limit), data: users });
  } catch (error) { next(error); }
};

// @desc    Toggle user active / suspended status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot deactivate admin accounts' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account is now ${user.isActive ? 'Active' : 'Suspended'}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all parking locations (including unapproved)
// @route   GET /api/admin/locations
// @access  Private (Admin)
exports.getAllLocations = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const [locations, total] = await Promise.all([
      ParkingLocation.find().populate('owner', 'name email phone').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ParkingLocation.countDocuments(),
    ]);
    res.status(200).json({ success: true, count: locations.length, total, page, limit, pages: Math.ceil(total / limit), data: locations });
  } catch (error) { next(error); }
};

// @desc    Toggle approval status of a parking location
// @route   PUT /api/admin/locations/:id/toggle-approval
// @access  Private (Admin)
exports.toggleLocationApproval = async (req, res, next) => {
  try {
    const location = await ParkingLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    location.isApproved = !location.isApproved;
    await location.save();

    res.status(200).json({
      success: true,
      message: `Parking location is now ${location.isApproved ? 'Approved' : 'Unapproved'}`,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get master list of all bookings across platform
// @route   GET /api/admin/bookings
// @access  Private (Admin)
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const query = {};
    if (status && status !== 'all') query.bookingStatus = status;
    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate('location', 'name address')
        .populate('slot', 'slotNumber floor type')
        .populate('vehicle', 'licensePlate make model isEV')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Booking.countDocuments(query),
    ]);

    // Secondary populated-field search is intentionally limited to the current page;
    // primary booking-reference search remains database-side for predictable performance.
    let data = bookings;
    if (search) {
      const q = search.toLowerCase();
      data = bookings.filter((b) =>
        b.bookingReference?.toLowerCase().includes(q) ||
        b.user?.name?.toLowerCase().includes(q) ||
        b.location?.name?.toLowerCase().includes(q) ||
        b.vehicle?.licensePlate?.toLowerCase().includes(q)
      );
    }
    res.status(200).json({ success: true, count: data.length, total, page, limit, pages: Math.ceil(total / limit), data });
  } catch (error) { next(error); }
};

// @desc    Admin manually updates booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private (Admin)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'active', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid booking status.' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.bookingStatus === status) return res.status(200).json({ success: true, message: 'Booking already has that status.', data: booking });

    if (status === 'active') {
      if (booking.paymentStatus !== 'completed' || booking.bookingStatus !== 'confirmed') {
        return res.status(409).json({ success: false, message: 'Only a paid confirmed booking can be activated.' });
      }
      const activated = await Booking.findOneAndUpdate(
        { _id: booking._id, bookingStatus: 'confirmed', paymentStatus: 'completed' },
        { $set: { bookingStatus: 'active', reservationState: 'confirmed', checkInTime: new Date() } },
        { new: true }
      );
      const slot = await ParkingSlot.findOneAndUpdate(
        { _id: booking.slot, currentBooking: booking._id, status: 'Reserved' },
        { $set: { status: 'Occupied', currentOccupant: booking.user, reservationExpiresAt: null } },
        { new: true }
      );
      if (!activated || !slot) {
        await Booking.updateOne({ _id: booking._id, bookingStatus: 'active' }, { $set: { bookingStatus: 'confirmed', checkInTime: null } });
        return res.status(409).json({ success: false, message: 'Slot state changed; activation was not completed.' });
      }
      await require('../services/parkingState').syncLocationAvailability(booking.location);
      return res.status(200).json({ success: true, message: 'Booking activated and slot marked occupied.', data: activated });
    }

    if (status === 'completed') {
      if (booking.bookingStatus !== 'active') return res.status(409).json({ success: false, message: 'Only active bookings can be completed.' });
      const completed = await Booking.findOneAndUpdate(
        { _id: booking._id, bookingStatus: 'active' },
        { $set: { bookingStatus: 'completed', reservationState: 'completed', checkOutTime: new Date() } },
        { new: true }
      );
      const slot = await ParkingSlot.findOneAndUpdate(
        { _id: booking.slot, currentBooking: booking._id, status: { $in: ['Occupied', 'Handover_Pending'] } },
        { $set: { status: 'Available', currentBooking: null, currentOccupant: null, expectedFreeTime: null, handoverRequested: false } },
        { new: true }
      );
      if (!completed || !slot) return res.status(409).json({ success: false, message: 'Slot state changed; completion requires manual reconciliation.' });
      await require('../services/parkingState').syncLocationAvailability(booking.location);
      return res.status(200).json({ success: true, message: 'Booking completed and slot released.', data: completed });
    }

    if (status === 'cancelled') {
      if (booking.bookingStatus === 'active') return res.status(409).json({ success: false, message: 'Active bookings must be checked out before cancellation.' });
      const cancelled = await Booking.findOneAndUpdate(
        { _id: booking._id, bookingStatus: { $nin: ['completed', 'cancelled'] } },
        { $set: { bookingStatus: 'cancelled', paymentStatus: booking.paymentStatus === 'completed' ? 'refunded' : 'failed', reservationState: 'released', reservationExpiresAt: null } },
        { new: true }
      );
      if (!cancelled) return res.status(409).json({ success: false, message: 'Booking was already changed.' });
      const slot = await ParkingSlot.findOneAndUpdate(
        { _id: booking.slot, currentBooking: booking._id, status: 'Reserved' },
        { $set: { status: 'Available', currentBooking: null, currentOccupant: null, expectedFreeTime: null, reservationExpiresAt: null, handoverRequested: false } },
        { new: true }
      );
      await Payment.updateOne({ booking: booking._id, status: { $in: ['success', 'pending', 'processing'] } }, { $set: { status: booking.paymentStatus === 'completed' ? 'refunded' : 'failed' } });
      if (slot) await require('../services/parkingState').syncLocationAvailability(booking.location);
      return res.status(200).json({ success: true, message: 'Booking cancelled and reservation released.', data: cancelled });
    }

    return res.status(400).json({ success: false, message: 'Unsupported state transition.' });
  } catch (error) { next(error); }
};

exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const Payment = require('../models/Payment');
    const HandoverRequest = require('../models/HandoverRequest');
    const Booking = require('../models/Booking');
    const ParkingSlot = require('../models/ParkingSlot');

    const [payments, handovers, totalSlots, evSlots] = await Promise.all([
      Payment.find({}).select('method status amount createdAt'),
      HandoverRequest.find({}).select('status createdAt'),
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ type: 'EV' }),
    ]);

    const successfulPayments = payments.filter((p) => p.status === 'success');
    const paymentMethods = ['UPI', 'Card', 'NetBanking', 'EcoPoints'].map((method) => ({
      method,
      count: successfulPayments.filter((p) => p.method === method).length,
      amount: successfulPayments
        .filter((p) => p.method === method)
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    }));

    const handoverStats = ['Expected_Soon', 'Handover_Requested', 'Handover_Confirmed', 'Completed', 'Cancelled']
      .map((status) => ({
        status,
        count: handovers.filter((h) => h.status === status).length,
      }));

    const bookings = await Booking.find({}).select('startTime');
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      bookings: bookings.filter((b) => new Date(b.startTime).getHours() === hour).length,
    })).filter((item) => item.bookings > 0);

    res.status(200).json({
      success: true,
      data: {
        totalPayments: payments.length,
        successfulPayments: successfulPayments.length,
        paymentMethods,
        handoverStats,
        evSharePercent: totalSlots ? Math.round((evSlots / totalSlots) * 100) : 0,
        peakHours,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.getAllPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const query = {};
    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    const [payments, total] = await Promise.all([
      require('../models/Payment').find(query)
        .populate('user', 'name email')
        .populate('booking', 'bookingReference bookingStatus finalAmount')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      require('../models/Payment').countDocuments(query),
    ]);
    res.status(200).json({ success: true, count: payments.length, total, page, limit, pages: Math.ceil(total / limit), data: payments });
  } catch (error) { next(error); }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const Payment = require('../models/Payment');
    const payment = await Payment.findById(req.params.id).populate('booking');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'success') return res.status(400).json({ success: false, message: 'Only successful payments can be refunded.' });

    const booking = payment.booking;
    if (!booking) return res.status(400).json({ success: false, message: 'Linked booking not found.' });
    if (booking.bookingStatus === 'active') {
      return res.status(400).json({ success: false, message: 'Active parking sessions must check out before refund.' });
    }

    payment.status = 'refunded';
    await payment.save();

    booking.paymentStatus = 'refunded';
    booking.bookingStatus = 'cancelled';
    await booking.save();

    const slot = await ParkingSlot.findById(booking.slot);
    if (slot && slot.currentBooking?.toString() === booking._id.toString()) {
      slot.status = 'Available';
      slot.currentBooking = null;
      slot.currentOccupant = null;
      slot.expectedFreeTime = null;
      await slot.save();
      await ParkingLocation.findByIdAndUpdate(booking.location, { $inc: { availableSlots: 1 } });
    }

    res.status(200).json({ success: true, message: 'Payment marked as refunded in ParkEasy test mode.', data: payment });
  } catch (error) {
    next(error);
  }
};
