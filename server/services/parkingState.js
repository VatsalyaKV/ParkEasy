const mongoose = require('mongoose');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLocation = require('../models/ParkingLocation');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

const HOLD_MINUTES = Math.min(10, Math.max(5, Number(process.env.PAYMENT_HOLD_MINUTES) || 8));

async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

function isTransactionUnsupported(error) {
  return [20, 251, 263].includes(error?.code) ||
    /transaction numbers are only allowed|replica set|transaction is not supported/i.test(error?.message || '');
}

async function runWithTransaction(work, fallback) {
  try {
    return await withTransaction(work);
  } catch (error) {
    if (!isTransactionUnsupported(error)) throw error;
    // Local standalone MongoDB does not support multi-document transactions.
    // The fallback still uses atomic state transitions and compensating cleanup.
    return fallback();
  }
}

async function syncLocationAvailability(locationId, session) {
  const available = await ParkingSlot.countDocuments({
    location: locationId,
    status: 'Available',
  }).session(session || null);

  await ParkingLocation.updateOne(
    { _id: locationId },
    { $set: { availableSlots: Math.max(0, available) } },
    session ? { session } : {}
  );
  return available;
}

async function releaseBookingReservation(bookingId, reason = 'expired', options = {}) {
  const session = options.session;
  const booking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      paymentStatus: { $in: ['pending', 'processing'] },
      bookingStatus: 'confirmed',
    },
    {
      $set: {
        paymentStatus: 'failed',
        bookingStatus: 'cancelled',
        reservationState: 'expired',
        expiredAt: new Date(),
        expirationReason: reason,
      },
    },
    { new: true, session }
  );

  if (!booking) return null;

  const slot = await ParkingSlot.findOneAndUpdate(
    {
      _id: booking.slot,
      currentBooking: booking._id,
      status: 'Reserved',
    },
    {
      $set: {
        status: 'Available',
        currentBooking: null,
        currentOccupant: null,
        expectedFreeTime: null,
        reservationExpiresAt: null,
        handoverRequested: false,
      },
    },
    { new: true, session }
  );

  if (slot) await syncLocationAvailability(booking.location, session);

  await Payment.updateOne(
    { booking: booking._id, status: { $in: ['pending', 'processing'] } },
    {
      $set: {
        status: 'failed',
        gatewayResponse: {
          gateway: 'ParkEasy Test Payment Gateway',
          status: 'EXPIRED',
          reason,
          timestamp: new Date(),
        },
      },
    },
    { session }
  );

  await Notification.create([{
    user: booking.user,
    title: 'Payment Hold Expired',
    message: `Reservation ${booking.bookingReference} expired because payment was not completed within the hold window.`,
    type: 'booking',
    link: '/my-bookings',
  }], session ? { session } : undefined);

  return { booking, slot };
}

async function releaseExpiredReservations(io) {
  const expired = await Booking.find({
    paymentStatus: { $in: ['pending', 'processing'] },
    bookingStatus: 'confirmed',
    reservationExpiresAt: { $lte: new Date() },
  }).select('_id location');

  for (const item of expired) {
    try {
      const result = await runWithTransaction(
        (session) => releaseBookingReservation(item._id, 'payment_timeout', { session }),
        () => releaseBookingReservation(item._id, 'payment_timeout')
      );
      if (result?.slot && io) {
        io.to(`location_${result.booking.location}`).emit('slotStatusChanged', {
          slotId: result.slot._id,
          locationId: result.booking.location,
          slotNumber: result.slot.slotNumber,
          newStatus: 'Available',
          expectedFreeTime: null,
        });
      }
    } catch (error) {
      console.error('[Reservation Cleanup]', item._id.toString(), error.message);
    }
  }
  return expired.length;
}

module.exports = {
  HOLD_MINUTES,
  withTransaction,
  runWithTransaction,
  syncLocationAvailability,
  releaseBookingReservation,
  releaseExpiredReservations,
};
