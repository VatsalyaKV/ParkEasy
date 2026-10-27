const mongoose = require('mongoose');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const EcoReward = require('../models/EcoReward');
const Notification = require('../models/Notification');
const {
  runWithTransaction,
  syncLocationAvailability,
} = require('../services/parkingState');

const METHODS = ['Card', 'UPI', 'NetBanking', 'EcoPoints'];

exports.processPayment = async (req, res, next) => {
  try {
    const { bookingId, method, simulateFailure } = req.body;
    const idempotencyKey = String(req.get('Idempotency-Key') || '').trim();
    if (idempotencyKey && idempotencyKey.length > 128) {
      return res.status(400).json({ success: false, message: 'Idempotency-Key is too long.' });
    }
    if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: 'A valid bookingId is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot pay for another user’s booking.' });
    }

    if (idempotencyKey) {
      const replay = await Payment.findOne({ user: req.user.id, idempotencyKey });
      if (replay) return res.status(200).json({ success: true, message: 'Existing payment returned for this idempotency key.', data: replay, idempotentReplay: true });
    }

    if (booking.paymentStatus === 'completed') {
      const existing = await Payment.findOne({ booking: booking._id });
      return res.status(200).json({ success: true, message: 'Payment was already completed.', data: existing });
    }

    if (booking.bookingStatus !== 'confirmed' || !['pending', 'failed'].includes(booking.paymentStatus)) {
      return res.status(409).json({ success: false, message: `Payment cannot start from booking state ${booking.bookingStatus}/${booking.paymentStatus}.` });
    }

    if (!booking.reservationExpiresAt || new Date(booking.reservationExpiresAt) <= new Date()) {
      return res.status(410).json({ success: false, message: 'The payment hold has expired. Please create a new reservation.' });
    }

    const paymentMethod = METHODS.includes(method) ? method : booking.paymentMethod;
    const amount = Number(booking.finalAmount); // authoritative server-calculated amount

    // Claim the payment operation atomically. This prevents double-click/concurrent payments.
    const processingBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        user: req.user.id,
        bookingStatus: 'confirmed',
        paymentStatus: { $in: ['pending', 'failed'] },
        reservationExpiresAt: { $gt: new Date() },
      },
      { $set: { paymentStatus: 'processing', paymentMethod } },
      { new: true }
    );

    if (!processingBooking) {
      const current = await Booking.findById(booking._id);
      if (current?.paymentStatus === 'completed') {
        const existing = await Payment.findOne({ booking: booking._id });
        return res.status(200).json({ success: true, message: 'Payment was already completed.', data: existing });
      }
      return res.status(409).json({ success: false, message: 'Another payment attempt is already being processed.' });
    }

    const transactionId = `TXN-${Date.now()}-${crypto.randomInt(100000, 1000000)}`;

    try {
      const result = await runWithTransaction(
        async (session) => {
          let payment = await Payment.findOne({ booking: processingBooking._id }).session(session);

          if (!payment) {
            [payment] = await Payment.create([{
              booking: processingBooking._id,
              idempotencyKey: idempotencyKey || undefined,
              user: req.user.id,
              amount,
              method: paymentMethod,
              transactionId,
              status: 'processing',
              gatewayResponse: { gateway: 'ParkEasy Test Payment Gateway', mode: 'SIMULATED', status: 'PROCESSING' },
            }], { session });
          } else {
            payment.amount = amount;
            payment.method = paymentMethod;
            if (idempotencyKey && !payment.idempotencyKey) payment.idempotencyKey = idempotencyKey;
            payment.status = 'processing';
            if (!payment.transactionId || payment.transactionId.startsWith('PENDING-')) payment.transactionId = transactionId;
            await payment.save({ session });
          }

          if (simulateFailure === true) {
            payment.status = 'failed';
            payment.gatewayResponse = {
              gateway: 'ParkEasy Test Payment Gateway',
              mode: 'SIMULATED',
              status: 'FAILED',
              reason: 'SIMULATED_FAILURE',
              timestamp: new Date(),
            };
            await payment.save({ session });
            await Booking.updateOne(
              { _id: processingBooking._id, paymentStatus: 'processing' },
              { $set: { paymentStatus: 'failed' } },
              { session }
            );
            return { success: false, payment };
          }

          let redeemed = 0;
          if (processingBooking.pointsToRedeem > 0) {
            const updatedUser = await User.findOneAndUpdate(
              { _id: req.user.id, ecoPoints: { $gte: processingBooking.pointsToRedeem } },
              { $inc: { ecoPoints: -processingBooking.pointsToRedeem } },
              { new: true, session }
            );
            if (!updatedUser) {
              payment.status = 'failed';
              payment.gatewayResponse = {
                gateway: 'ParkEasy Test Payment Gateway',
                mode: 'SIMULATED',
                status: 'FAILED',
                reason: 'INSUFFICIENT_ECO_POINTS',
              };
              await payment.save({ session });
              await Booking.updateOne(
                { _id: processingBooking._id, paymentStatus: 'processing' },
                { $set: { paymentStatus: 'failed' } },
                { session }
              );
              return { success: false, payment, insufficientPoints: true };
            }
            redeemed = processingBooking.pointsToRedeem;
            await EcoReward.create([{
              user: req.user.id,
              pointsSpent: redeemed,
              booking: processingBooking._id,
              reason: `Eco Points redeemed for booking discount (₹${processingBooking.pointsDiscount} off)`,
            }], { session });
          }

          const completed = await Booking.findOneAndUpdate(
            {
              _id: processingBooking._id,
              user: req.user.id,
              paymentStatus: 'processing',
              bookingStatus: 'confirmed',
              reservationExpiresAt: { $gt: new Date() },
            },
            {
              $set: {
                paymentStatus: 'completed',
                reservationState: 'confirmed',
                reservationExpiresAt: null,
              },
            },
            { new: true, session }
          );

          if (!completed) {
            const error = new Error('Payment hold expired while payment was being processed.');
            error.statusCode = 409;
            throw error;
          }

          payment.status = 'success';
          payment.gatewayResponse = {
            gateway: 'ParkEasy Test Payment Gateway',
            mode: 'SIMULATED',
            status: 'PAID_SIMULATED',
            currency: 'INR',
            method: paymentMethod,
            timestamp: new Date(),
            reference: payment.transactionId,
          };
          await payment.save({ session });

          const user = await User.findById(req.user.id).session(session);
          const vehicle = await Vehicle.findById(completed.vehicle).session(session);
          if (user && completed.ecoPointsEarned > 0) {
            user.ecoPoints += completed.ecoPointsEarned;
            await user.save({ session });
            await EcoReward.create([{
              user: user._id,
              pointsEarned: completed.ecoPointsEarned,
              booking: completed._id,
              reason: vehicle?.isEV ? 'EcoPark EV Parking Incentive' : 'Smart Parking Booking Reward',
              carbonOffsetKg: 0,
            }], { session });
          }

          await Payment.updateOne(
            { _id: payment._id, status: 'success' },
            { $set: { amount } },
            { session }
          );

          await Notification.create([{
            user: req.user.id,
            title: 'Payment Successful',
            message: `Payment of ₹${amount} for ${completed.bookingReference} was completed in ParkEasy test/simulated mode.`,
            type: 'booking',
            link: `/booking-confirmation/${completed._id}`,
          }], { session });

          return { success: true, payment, booking: completed, redeemed };
        },
        async () => {
          let payment = await Payment.findOne({ booking: processingBooking._id });
          if (!payment) {
            payment = await Payment.create({
              booking: processingBooking._id,
              idempotencyKey: idempotencyKey || undefined,
              user: req.user.id,
              amount,
              method: paymentMethod,
              transactionId,
              status: 'processing',
              gatewayResponse: { gateway: 'ParkEasy Test Payment Gateway', mode: 'SIMULATED', status: 'PROCESSING' },
            });
          }

          if (simulateFailure === true) {
            payment.status = 'failed';
            payment.gatewayResponse = { gateway: 'ParkEasy Test Payment Gateway', mode: 'SIMULATED', status: 'FAILED', reason: 'SIMULATED_FAILURE' };
            await payment.save();
            await Booking.updateOne({ _id: processingBooking._id, paymentStatus: 'processing' }, { $set: { paymentStatus: 'failed' } });
            return { success: false, payment };
          }

          if (processingBooking.pointsToRedeem > 0) {
            const userUpdated = await User.findOneAndUpdate(
              { _id: req.user.id, ecoPoints: { $gte: processingBooking.pointsToRedeem } },
              { $inc: { ecoPoints: -processingBooking.pointsToRedeem } },
              { new: true }
            );
            if (!userUpdated) {
              payment.status = 'failed';
              payment.gatewayResponse = { gateway: 'ParkEasy Test Payment Gateway', mode: 'SIMULATED', status: 'FAILED', reason: 'INSUFFICIENT_ECO_POINTS' };
              await payment.save();
              await Booking.updateOne({ _id: processingBooking._id, paymentStatus: 'processing' }, { $set: { paymentStatus: 'failed' } });
              return { success: false, payment, insufficientPoints: true };
            }
            await EcoReward.create({
              user: req.user.id, pointsSpent: processingBooking.pointsToRedeem,
              booking: processingBooking._id, reason: `Eco Points redeemed for booking discount (₹${processingBooking.pointsDiscount} off)`,
            });
          }

          const completed = await Booking.findOneAndUpdate(
            { _id: processingBooking._id, paymentStatus: 'processing', bookingStatus: 'confirmed', reservationExpiresAt: { $gt: new Date() } },
            { $set: { paymentStatus: 'completed', reservationState: 'confirmed', reservationExpiresAt: null } },
            { new: true }
          );
          if (!completed) throw Object.assign(new Error('Payment hold expired while payment was being processed.'), { statusCode: 409 });

          payment.status = 'success';
          payment.amount = amount;
          payment.gatewayResponse = { gateway: 'ParkEasy Test Payment Gateway', mode: 'SIMULATED', status: 'PAID_SIMULATED', currency: 'INR', method: paymentMethod, timestamp: new Date(), reference: payment.transactionId };
          await payment.save();

          const user = await User.findById(req.user.id);
          const vehicle = await Vehicle.findById(completed.vehicle);
          if (user && completed.ecoPointsEarned > 0) {
            user.ecoPoints += completed.ecoPointsEarned;
            await user.save();
            await EcoReward.create({ user: user._id, pointsEarned: completed.ecoPointsEarned, booking: completed._id, reason: vehicle?.isEV ? 'EcoPark EV Parking Incentive' : 'Smart Parking Booking Reward', carbonOffsetKg: 0 });
          }
          await Notification.create({ user: req.user.id, title: 'Payment Successful', message: `Payment of ₹${amount} for ${completed.bookingReference} was completed in ParkEasy test/simulated mode.`, type: 'booking', link: `/booking-confirmation/${completed._id}` });
          return { success: true, payment, booking: completed };
        }
      );

      if (!result.success) {
        return res.status(402).json({
          success: false,
          message: result.insufficientPoints ? 'Your Eco Point balance changed. Please retry payment or create a new reservation.' : 'Test payment was declined.',
          data: result.payment,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment successful in ParkEasy test/simulated mode. No real money was transferred.',
        data: result.payment,
      });
    } catch (error) {
      // Return a processing booking to retryable pending only when the failure happened before capture.
      await Booking.updateOne(
        { _id: processingBooking._id, paymentStatus: 'processing' },
        { $set: { paymentStatus: 'failed' } }
      ).catch(() => {});
      throw error;
    }
  } catch (error) {
    next(error);
  }
};


exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('booking', 'bookingReference bookingStatus finalAmount location').populate('user', 'name email');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    if (payment.user._id.toString() !== req.user.id && !['admin', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this payment.' });
    }
    if (req.user.role === 'owner') {
      const ParkingLocation = require('../models/ParkingLocation');
      const owned = await ParkingLocation.exists({ _id: payment.booking.location, owner: req.user.id });
      if (!owned) return res.status(403).json({ success: false, message: 'Unauthorized to view this payment.' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) { next(error); }
};
