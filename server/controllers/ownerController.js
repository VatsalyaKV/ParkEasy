const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get Owner Dashboard Overview & KPI Metrics
// @route   GET /api/owner/dashboard
// @access  Private (Owner/Admin)
exports.getOwnerDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Locations owned by this user
    const locations = await ParkingLocation.find({ owner: ownerId });
    const locationIds = locations.map((l) => l._id);

    // Slots belonging to these locations
    const slots = await ParkingSlot.find({ location: { $in: locationIds } });
    const totalSlots = slots.length;
    const availableSlots = slots.filter((s) => s.status === 'Available').length;
    const occupiedSlots = slots.filter((s) => s.status === 'Occupied').length;
    const reservedSlots = slots.filter((s) => s.status === 'Reserved').length;
    const evSlots = slots.filter((s) => s.type === 'EV').length;

    // Today's bookings and revenue
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const allBookings = await Booking.find({ location: { $in: locationIds } })
      .populate('user', 'name email')
      .populate('slot', 'slotNumber floor type')
      .populate('location', 'name')
      .populate('vehicle', 'licensePlate make model isEV')
      .sort({ createdAt: -1 });

    const todayBookings = allBookings.filter((b) => new Date(b.createdAt) >= startOfToday);
    const todayRevenue = todayBookings
      .filter((b) => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + (b.finalAmount || 0), 0);

    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + (b.finalAmount || 0), 0);

    const upcomingReservations = allBookings.filter(
      (b) => b.bookingStatus === 'confirmed' && new Date(b.startTime) >= new Date()
    );

    // Build the last-7-days chart from this owner's real booking records.
    const dailyBookingsChart = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - (6 - index));
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayBookings = allBookings.filter((booking) => {
        const created = new Date(booking.createdAt);
        return created >= dayStart && created < dayEnd;
      });

      return {
        day: dayStart.toLocaleDateString('en-IN', { weekday: 'short' }),
        bookings: dayBookings.length,
        revenue: dayBookings
          .filter((booking) => booking.paymentStatus === 'completed')
          .reduce((sum, booking) => sum + (booking.finalAmount || 0), 0),
      };
    });

    const slotUtilization = [
      { name: 'Available', value: availableSlots, color: '#10B981' },
      { name: 'Occupied', value: occupiedSlots, color: '#EF4444' },
      { name: 'Reserved', value: reservedSlots, color: '#F59E0B' },
      { name: 'EV Bays', value: evSlots, color: '#3B82F6' },
    ];

    res.status(200).json({
      success: true,
      data: {
        totalLocations: locations.length,
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        evSlots,
        occupancyRate: totalSlots > 0 ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100) : 0,
        todayBookingsCount: todayBookings.length,
        todayRevenue,
        totalRevenue,
        upcomingReservationsCount: upcomingReservations.length,
        recentReservations: allBookings.slice(0, 5),
        dailyBookingsChart,
        slotUtilization,
        locations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reservations for owner's parking locations
// @route   GET /api/owner/reservations
// @access  Private (Owner/Admin)
exports.getOwnerReservations = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const locations = await ParkingLocation.find({ owner: ownerId }).select('_id');
    const locationIds = locations.map((l) => l._id);
    const { status, search } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const query = { location: { $in: locationIds } };
    if (status && status !== 'all') query.bookingStatus = status;
    if (search) query.bookingReference = { $regex: search, $options: 'i' };

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('location', 'name address').populate('slot', 'slotNumber floor type')
        .populate('user', 'name email phone').populate('vehicle', 'licensePlate make model type isEV')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Booking.countDocuments(query),
    ]);
    let data = bookings;
    if (search) {
      const q = search.toLowerCase();
      data = bookings.filter((b) =>
        b.bookingReference?.toLowerCase().includes(q) ||
        b.user?.name?.toLowerCase().includes(q) ||
        b.vehicle?.licensePlate?.toLowerCase().includes(q) ||
        b.slot?.slotNumber?.toLowerCase().includes(q)
      );
    }
    res.status(200).json({ success: true, count: data.length, total, page, limit, pages: Math.ceil(total / limit), data });
  } catch (error) { next(error); }
};

// @desc    Get customers who have parked at owner's lots
// @route   GET /api/owner/users
// @access  Private (Owner/Admin)
exports.getOwnerUsers = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const locations = await ParkingLocation.find({ owner: ownerId }).select('_id');
    const locationIds = locations.map((l) => l._id);
    const bookings = await Booking.find({ location: { $in: locationIds } })
      .populate('user', 'name email phone createdAt').populate('vehicle', 'licensePlate make model isEV')
      .sort({ createdAt: -1 }).limit(5000);

    const userMap = {};
    bookings.forEach((b) => {
      if (!b.user) return;
      const id = b.user._id.toString();
      if (!userMap[id]) userMap[id] = {
        id, name: b.user.name, email: b.user.email, phone: b.user.phone,
        totalBookings: 0, totalSpent: 0, lastVisit: b.createdAt,
        lastVehicle: b.vehicle ? `${b.vehicle.make} ${b.vehicle.model} (${b.vehicle.licensePlate})` : 'N/A',
      };
      userMap[id].totalBookings += 1;
      userMap[id].totalSpent += b.finalAmount || 0;
    });

    let userList = Object.values(userMap);
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      userList = userList.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    const total = userList.length;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    userList = userList.slice((page - 1) * limit, page * limit);
    res.status(200).json({ success: true, count: userList.length, total, page, limit, pages: Math.ceil(total / limit), data: userList });
  } catch (error) { next(error); }
};

// @desc    Get detailed revenue and analytics
// @route   GET /api/owner/revenue
// @access  Private (Owner/Admin)
exports.getOwnerRevenue = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const locations = await ParkingLocation.find({ owner: ownerId });
    const locationIds = locations.map((l) => l._id);

    const bookings = await Booking.find({
      location: { $in: locationIds },
      paymentStatus: 'completed',
    }).populate('location', 'name');

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);
    const evRevenue = bookings
      .filter((b) => b.evDiscount > 0)
      .reduce((sum, b) => sum + (b.finalAmount || 0), 0);

    // Revenue per location
    const locationRevenue = {};
    locations.forEach((loc) => {
      locationRevenue[loc.name] = 0;
    });

    bookings.forEach((b) => {
      const locName = b.location?.name;
      if (locName) {
        locationRevenue[locName] = (locationRevenue[locName] || 0) + b.finalAmount;
      }
    });

    const revenueByLocationData = Object.keys(locationRevenue).map((name) => ({
      name,
      revenue: locationRevenue[name],
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        evRevenue,
        regularRevenue: totalRevenue - evRevenue,
        bookingsCount: bookings.length,
        averageTicketSize: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
        revenueByLocation: revenueByLocationData,
      },
    });
  } catch (error) {
    next(error);
  }
};
