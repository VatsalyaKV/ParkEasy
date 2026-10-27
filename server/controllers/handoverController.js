const HandoverRequest = require('../models/HandoverRequest');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const EcoReward = require('../models/EcoReward');
const { runWithTransaction, syncLocationAvailability } = require('../services/parkingState');

exports.getAvailableHandovers = async (req, res, next) => {
  try {
    const { locationId } = req.query;
    const query = { status: { $in: ['Expected_Soon', 'Handover_Requested'] } };
    if (locationId) query.location = locationId;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const [handovers, total] = await Promise.all([
      HandoverRequest.find(query)
        .populate('location', 'name address city hourlyRate images')
        .populate('slot', 'slotNumber floor type evChargerType')
        .populate('currentUserId', 'name')
        .populate('waitingUserId', 'name')
        .sort({ expectedDepartureTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      HandoverRequest.countDocuments(query),
    ]);

    res.status(200).json({ success: true, count: handovers.length, total, page, limit, pages: Math.ceil(total / limit), data: handovers });
  } catch (error) { next(error); }
};

exports.announceDeparture = async (req, res, next) => {
  try {
    const { bookingId, expectedDepartureMinutes, exactTime, notes } = req.body;
    const userId = req.user.id;
    const booking = await Booking.findOne({ _id: bookingId, user: userId, bookingStatus: 'active', paymentStatus: 'completed' });
    if (!booking) return res.status(404).json({ success: false, message: 'No active paid booking found to initiate a space handover.' });

    const depTime = exactTime ? new Date(exactTime) : new Date(Date.now() + (Number(expectedDepartureMinutes) || 15) * 60 * 1000);
    if (Number.isNaN(depTime.getTime()) || depTime <= new Date()) {
      return res.status(400).json({ success: false, message: 'Expected departure must be a valid future time.' });
    }

    const result = await runWithTransaction(
      async (session) => {
        const slot = await ParkingSlot.findOne({ _id: booking.slot, currentBooking: booking._id, status: 'Occupied' }).session(session);
        if (!slot) throw Object.assign(new Error('The assigned slot is not currently occupied by this booking.'), { statusCode: 409 });

        let handover = await HandoverRequest.findOne({ slot: slot._id, currentBookingId: booking._id, status: { $ne: 'Completed' } }).session(session);
        if (handover) {
          handover.expectedDepartureTime = depTime;
          handover.notes = notes || handover.notes;
          await handover.save({ session });
        } else {
          [handover] = await HandoverRequest.create([{
            slot: slot._id, location: booking.location, currentUserId: userId,
            currentBookingId: booking._id, expectedDepartureTime: depTime,
            status: 'Expected_Soon', notes: notes || 'Departing shortly; slot ready for immediate handover.',
          }], { session });
        }

        slot.expectedFreeTime = depTime;
        slot.status = 'Handover_Pending';
        slot.handoverRequested = false;
        await slot.save({ session });

        booking.isHandoverOffered = true;
        await booking.save({ session });
        return { handover, slot };
      },
      async () => {
        const slot = await ParkingSlot.findOne({ _id: booking.slot, currentBooking: booking._id, status: 'Occupied' });
        if (!slot) throw Object.assign(new Error('The assigned slot is not currently occupied by this booking.'), { statusCode: 409 });
        let handover = await HandoverRequest.findOne({ slot: slot._id, currentBookingId: booking._id, status: { $ne: 'Completed' } });
        if (handover) {
          handover.expectedDepartureTime = depTime;
          handover.notes = notes || handover.notes;
          await handover.save();
        } else {
          handover = await HandoverRequest.create({
            slot: slot._id, location: booking.location, currentUserId: userId,
            currentBookingId: booking._id, expectedDepartureTime: depTime,
            status: 'Expected_Soon', notes: notes || 'Departing shortly; slot ready for immediate handover.',
          });
        }
        await ParkingSlot.updateOne({ _id: slot._id, currentBooking: booking._id, status: 'Occupied' }, { $set: { status: 'Handover_Pending', expectedFreeTime: depTime, handoverRequested: false } });
        await Booking.updateOne({ _id: booking._id }, { $set: { isHandoverOffered: true } });
        return { handover, slot };
      }
    );

    req.io?.to(`location_${booking.location}`).emit('handoverAnnounced', {
      handoverId: result.handover._id, slotId: result.slot._id, slotNumber: result.slot.slotNumber,
      expectedDepartureTime: depTime, status: 'Expected_Soon',
    });

    res.status(200).json({ success: true, message: `Departure announced. Slot ${result.slot.slotNumber} is now available for handover requests.`, data: result.handover });
  } catch (error) { next(error); }
};

exports.requestHandover = async (req, res, next) => {
  try {
    const waitingUserId = req.user.id;
    const { vehicleId } = req.body;

    const vehicle = vehicleId
      ? await Vehicle.findOne({ _id: vehicleId, user: waitingUserId })
      : await Vehicle.findOne({ user: waitingUserId }).sort({ isDefault: -1, createdAt: 1 });
    if (!vehicle) return res.status(400).json({ success: false, message: 'Add a vehicle before requesting a parking handover.' });

    const result = await runWithTransaction(
      async (session) => {
        const handover = await HandoverRequest.findOneAndUpdate(
          {
            _id: req.params.id,
            status: 'Expected_Soon',
            waitingUserId: null,
            currentUserId: { $ne: waitingUserId },
          },
          { $set: { waitingUserId, waitingVehicleId: vehicle._id, status: 'Handover_Requested' } },
          { new: true, session }
        ).populate('slot', 'slotNumber').populate('location', 'name address city').populate('currentUserId', 'name');
        if (!handover) throw Object.assign(new Error('This handover slot has already been claimed or is no longer available.'), { statusCode: 409 });

        await ParkingSlot.updateOne(
          { _id: handover.slot._id, status: 'Handover_Pending', currentBooking: handover.currentBookingId },
          { $set: { handoverRequested: true } },
          { session }
        );
        return handover;
      },
      async () => {
        const handover = await HandoverRequest.findOneAndUpdate(
          { _id: req.params.id, status: 'Expected_Soon', waitingUserId: null, currentUserId: { $ne: waitingUserId } },
          { $set: { waitingUserId, waitingVehicleId: vehicle._id, status: 'Handover_Requested' } },
          { new: true }
        ).populate('slot', 'slotNumber').populate('location', 'name address city').populate('currentUserId', 'name');
        if (!handover) throw Object.assign(new Error('This handover slot has already been claimed or is no longer available.'), { statusCode: 409 });
        await ParkingSlot.updateOne({ _id: handover.slot._id, status: 'Handover_Pending', currentBooking: handover.currentBookingId }, { $set: { handoverRequested: true } });
        return handover;
      }
    );

    const slotNumber = result.slot.slotNumber;
    await Promise.all([
      Notification.create({
        user: result.currentUserId._id,
        title: 'Parking Space Handover Requested',
        message: `A waiting driver has requested your slot ${slotNumber}. Confirm departure only when you have physically left.`,
        type: 'handover',
        link: '/handover',
      }),
      Notification.create({
        user: waitingUserId,
        title: 'Handover Request Sent',
        message: `You have requested slot ${slotNumber}. You will be alerted when it is released.`,
        type: 'handover',
        link: '/handover',
      }),
    ]);

    req.io?.to(`location_${result.location._id}`).emit('handoverStatusUpdated', {
      handoverId: result._id, status: 'Handover_Requested', waitingUserName: req.user.name,
    });

    res.status(200).json({ success: true, message: `Handover requested for slot ${slotNumber}.`, data: result });
  } catch (error) { next(error); }
};

exports.confirmDeparture = async (req, res, next) => {
  try {
    const result = await runWithTransaction(
      async (session) => {
        const handover = await HandoverRequest.findOneAndUpdate(
          {
            _id: req.params.id,
            currentUserId: req.user.id,
            status: { $in: ['Expected_Soon', 'Handover_Requested', 'Handover_Confirmed'] },
          },
          { $set: { status: 'Completed' } },
          { new: true, session }
        ).populate('slot', 'slotNumber').populate('location', 'name address').populate('waitingUserId', 'name');
        if (!handover) throw Object.assign(new Error('Handover was already completed or is not owned by this driver.'), { statusCode: 409 });

        const booking = await Booking.findOneAndUpdate(
          { _id: handover.currentBookingId, user: req.user.id, bookingStatus: 'active' },
          { $set: { bookingStatus: 'completed', reservationState: 'completed', checkOutTime: new Date(), isHandoverOffered: false } },
          { new: true, session }
        );
        if (!booking) throw Object.assign(new Error('The active booking state changed. Handover was not completed.'), { statusCode: 409 });

        const slot = await ParkingSlot.findOneAndUpdate(
          { _id: handover.slot._id, currentBooking: booking._id, status: { $in: ['Handover_Pending', 'Occupied'] } },
          { $set: { status: 'Available', currentBooking: null, currentOccupant: null, expectedFreeTime: null, reservationExpiresAt: null, handoverRequested: false } },
          { new: true, session }
        );
        if (!slot) throw Object.assign(new Error('The physical slot state changed. Handover was not completed.'), { statusCode: 409 });

        await syncLocationAvailability(booking.location, session);

        const driver = await User.findById(req.user.id).session(session);
        if (driver) {
          driver.ecoPoints += 30;
          await driver.save({ session });
          await EcoReward.create([{ user: driver._id, pointsEarned: 30, reason: 'Parking Space Handover bonus' }], { session });
        }
        return { handover, booking, slot, waitingUserId: handover.waitingUserId?._id };
      },
      async () => {
        const handover = await HandoverRequest.findOneAndUpdate(
          { _id: req.params.id, currentUserId: req.user.id, status: { $in: ['Expected_Soon', 'Handover_Requested', 'Handover_Confirmed'] } },
          { $set: { status: 'Completed' } },
          { new: true }
        ).populate('slot', 'slotNumber').populate('location', 'name address').populate('waitingUserId', 'name');
        if (!handover) throw Object.assign(new Error('Handover was already completed or is not owned by this driver.'), { statusCode: 409 });

        const booking = await Booking.findOneAndUpdate({ _id: handover.currentBookingId, user: req.user.id, bookingStatus: 'active' }, { $set: { bookingStatus: 'completed', reservationState: 'completed', checkOutTime: new Date(), isHandoverOffered: false } }, { new: true });
        if (!booking) throw Object.assign(new Error('The active booking state changed. Handover was not completed.'), { statusCode: 409 });
        const slot = await ParkingSlot.findOneAndUpdate({ _id: handover.slot._id, currentBooking: booking._id, status: { $in: ['Handover_Pending', 'Occupied'] } }, { $set: { status: 'Available', currentBooking: null, currentOccupant: null, expectedFreeTime: null, reservationExpiresAt: null, handoverRequested: false } }, { new: true });
        if (!slot) throw Object.assign(new Error('The physical slot state changed. Handover was not completed.'), { statusCode: 409 });
        await syncLocationAvailability(booking.location);
        const driver = await User.findById(req.user.id);
        if (driver) {
          driver.ecoPoints += 30;
          await driver.save();
          await EcoReward.create({ user: driver._id, pointsEarned: 30, reason: 'Parking Space Handover bonus' });
        }
        return { handover, booking, slot, waitingUserId: handover.waitingUserId?._id };
      }
    );

    const notices = [
      Notification.create({
        user: req.user.id, title: 'Handover Completed! +30 Eco Points',
        message: 'Your confirmed departure released the parking slot safely. 30 Eco Points were added.',
        type: 'ecopark', link: '/ecopark',
      }),
    ];
    if (result.waitingUserId) {
      notices.push(Notification.create({
        user: result.waitingUserId,
        title: 'Your Requested Slot is Free!',
        message: `Slot ${result.slot.slotNumber} has been released. You can now proceed to the gate.`,
        type: 'handover',
        link: `/parking/${result.handover.location._id}`,
      }));
    }
    await Promise.all(notices);

    req.io?.to(`location_${result.handover.location._id}`).emit('handoverCompleted', {
      handoverId: result.handover._id, slotId: result.slot._id, slotNumber: result.slot.slotNumber, newStatus: 'Available',
    });
    req.io?.to(`location_${result.handover.location._id}`).emit('slotStatusChanged', {
      slotId: result.slot._id, locationId: result.handover.location._id,
      slotNumber: result.slot.slotNumber, newStatus: 'Available', expectedFreeTime: null,
    });

    res.status(200).json({ success: true, message: 'Departure confirmed. Slot released atomically and waiting driver notified.', data: result.handover });
  } catch (error) { next(error); }
};
