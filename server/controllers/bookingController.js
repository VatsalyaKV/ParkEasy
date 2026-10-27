const crypto = require('crypto');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLocation = require('../models/ParkingLocation');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Notification = require('../models/Notification');

const {
  HOLD_MINUTES,
  runWithTransaction,
  syncLocationAvailability,
  releaseBookingReservation,
} = require('../services/parkingState');


/**
 * Generate a unique ParkEasy booking reference.
 */
const generateBookingRef = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const ref = `PE-${new Date().getFullYear()}-${crypto.randomInt(1000, 10000)}`;

    if (!(await Booking.exists({ bookingReference: ref }))) {
      return ref;
    }
  }

  return `PE-${Date.now()}-${crypto.randomInt(100, 1000)}`;
};


/**
 * Emit real-time slot status update through Socket.IO.
 */
const emitSlotUpdate = (req, slot, locationId) => {
  if (!req.io) return;

  req.io.to(`location_${locationId}`).emit('slotStatusChanged', {
    slotId: slot._id,
    locationId,
    slotNumber: slot.slotNumber,
    newStatus: slot.status,
    expectedFreeTime: slot.expectedFreeTime || null,
    reservationExpiresAt: slot.reservationExpiresAt || null,
    type: slot.type,
    availabilitySource: slot.availabilitySource || 'application',
  });
};


/**
 * Populate booking information consistently.
 */
const populateBooking = (id) =>
  Booking.findById(id)
    .populate(
      'location',
      'name address city latitude longitude images hourlyRate evHourlyRate amenities operatingHours'
    )
    .populate(
      'slot',
      'slotNumber floor type evChargerType expectedFreeTime reservationExpiresAt availabilitySource sensorStatus'
    )
    .populate(
      'vehicle',
      'licensePlate make model color type isEV'
    );


/**
 * CREATE BOOKING
 */
exports.createBooking = async (req, res, next) => {
  try {
    const {
      slotId,
      vehicleId,
      startTime,
      durationHours,
      paymentMethod,
      redeemPoints,
    } = req.body;

    const userId = req.user.id;

    const idempotencyKey = String(
      req.get('Idempotency-Key') || ''
    ).trim();

    if (idempotencyKey && idempotencyKey.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Idempotency-Key is too long.',
      });
    }

    /**
     * Prevent duplicate booking requests.
     */
    if (idempotencyKey) {
      const existing = await Booking.findOne({
        user: userId,
        idempotencyKey,
      });

      if (existing) {
        const existingBooking = await populateBooking(existing._id);

        return res.status(200).json({
          success: true,
          message: 'Existing booking returned for this idempotency key.',
          data: existingBooking,
          idempotentReplay: true,
        });
      }
    }

    /**
     * Validate required booking information.
     */
    if (!slotId || !vehicleId || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Slot, vehicle and arrival time are required.',
      });
    }

    const start = new Date(startTime);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid arrival time.',
      });
    }

    const duration = Number(durationHours);

    if (
      !Number.isFinite(duration) ||
      duration < 0.5 ||
      duration > 24
    ) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 0.5 and 24 hours.',
      });
    }

    if (start.getTime() < Date.now() - 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Arrival time cannot be in the past.',
      });
    }

    /**
     * Verify vehicle belongs to current user.
     */
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: userId,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Selected vehicle not found in your garage.',
      });
    }

    /**
     * Validate payment method.
     */
    const validMethods = [
      'Card',
      'UPI',
      'NetBanking',
      'EcoPoints',
    ];

    const selectedMethod = validMethods.includes(paymentMethod)
      ? paymentMethod
      : 'UPI';

    /**
     * Temporary reservation hold.
     */
    const reservationExpiresAt = new Date(
      Date.now() + HOLD_MINUTES * 60 * 1000
    );


    /**
     * Transaction-based reservation.
     */
    const createReservation = async (session) => {
      const slot = await ParkingSlot.findOneAndUpdate(
        {
          _id: slotId,
          status: 'Available',
        },
        {
          $set: {
            status: 'Reserved',
            reservationExpiresAt,
            currentOccupant: null,
            handoverRequested: false,
          },
        },
        {
          new: true,
          session,
        }
      ).populate('location');

      if (!slot) {
        const error = new Error(
          'That parking slot was just reserved by another user. Please choose another slot.'
        );

        error.statusCode = 409;

        throw error;
      }

      const location = slot.location;

      if (
        !location ||
        !location.isApproved ||
        !location.isOpen
      ) {
        await ParkingSlot.updateOne(
          {
            _id: slotId,
            status: 'Reserved',
          },
          {
            $set: {
              status: 'Available',
              reservationExpiresAt: null,
            },
          },
          {
            session,
          }
        );

        const error = new Error(
          'This parking facility is not currently available for booking.'
        );

        error.statusCode = 400;

        throw error;
      }

      const end = new Date(
        start.getTime() +
          duration * 60 * 60 * 1000
      );

      const isEV = Boolean(
        vehicle.isEV || slot.type === 'EV'
      );

      const hourlyRate =
        isEV && location.evHourlyRate
          ? location.evHourlyRate
          : location.hourlyRate;

      const multiplier =
        Number(slot.pricingMultiplier) || 1;

      const basePrice = Math.round(
        hourlyRate * duration * multiplier
      );

      const evDiscount = isEV
        ? Math.min(
            Number(location.evIncentiveDiscount) || 0,
            basePrice
          )
        : 0;

      const user = await User.findById(userId).session(
        session
      );

      if (!user) {
        const error = new Error(
          'User account could not be loaded.'
        );

        error.statusCode = 401;

        throw error;
      }

      const requestedPoints = redeemPoints
        ? Math.min(
            100,
            Math.max(0, Number(user.ecoPoints) || 0)
          )
        : 0;

      const pointsDiscount = Math.min(
        Math.round(requestedPoints * 0.2),
        Math.max(
          0,
          basePrice - evDiscount - 10
        )
      );

      const finalAmount = Math.max(
        10,
        basePrice - evDiscount - pointsDiscount
      );

      const bookingRef = await generateBookingRef();

      const qrToken = crypto
        .randomBytes(32)
        .toString('hex');

      const [booking] = await Booking.create(
        [
          {
            bookingReference: bookingRef,
            idempotencyKey:
              idempotencyKey || undefined,

            qrToken,

            user: userId,
            vehicle: vehicle._id,
            location: location._id,
            slot: slot._id,

            startTime: start,
            endTime: end,

            durationHours: duration,

            basePrice,
            evDiscount,
            pointsDiscount,

            pointsToRedeem:
              pointsDiscount > 0
                ? requestedPoints
                : 0,

            finalAmount,

            paymentMethod: selectedMethod,

            paymentStatus: 'pending',
            bookingStatus: 'confirmed',

            reservationState: 'held',
            reservationExpiresAt,

            qrCodeData: `parkeasy://gate/${qrToken}`,

            ecoPointsEarned: isEV ? 50 : 15,
          },
        ],
        {
          session,
        }
      );

      await ParkingSlot.updateOne(
        {
          _id: slot._id,
          status: 'Reserved',
        },
        {
          $set: {
            currentBooking: booking._id,
            expectedFreeTime: end,
            reservationExpiresAt,
          },
        },
        {
          session,
        }
      );

      await syncLocationAvailability(
        location._id,
        session
      );

      await Payment.create(
        [
          {
            booking: booking._id,
            user: userId,

            amount: finalAmount,

            method: selectedMethod,

            transactionId:
              `PENDING-${bookingRef}`,

            status: 'pending',

            gatewayResponse: {
              gateway:
                'ParkEasy Test Payment Gateway',

              mode: 'SIMULATED',

              state: 'PAYMENT_PENDING',

              holdExpiresAt:
                reservationExpiresAt,
            },
          },
        ],
        {
          session,
        }
      );

      await Notification.create(
        [
          {
            user: userId,

            title:
              'Reservation Held — Payment Pending',

            message:
              `Slot ${slot.slotNumber} at ${location.name} is held for ${HOLD_MINUTES} minutes. Complete payment to confirm your parking pass.`,

            type: 'booking',

            link:
              `/booking-details/${booking._id}`,
          },
        ],
        {
          session,
        }
      );

      return booking;
    };


    /**
     * Fallback when MongoDB transactions are unavailable.
     */
    const fallback = async () => {
      let reservedSlot = null;
      let createdBookingId = null;

      try {
        reservedSlot =
          await ParkingSlot.findOneAndUpdate(
            {
              _id: slotId,
              status: 'Available',
            },
            {
              $set: {
                status: 'Reserved',
                reservationExpiresAt,
              },
            },
            {
              new: true,
            }
          ).populate('location');

        if (!reservedSlot) {
          const error = new Error(
            'That parking slot was just reserved by another user. Please choose another slot.'
          );

          error.statusCode = 409;

          throw error;
        }

        const location =
          reservedSlot.location;

        if (
          !location ||
          !location.isApproved ||
          !location.isOpen
        ) {
          throw Object.assign(
            new Error(
              'This parking facility is not currently available for booking.'
            ),
            {
              statusCode: 400,
            }
          );
        }

        const end = new Date(
          start.getTime() +
            duration * 60 * 60 * 1000
        );

        const isEV = Boolean(
          vehicle.isEV ||
            reservedSlot.type === 'EV'
        );

        const hourlyRate =
          isEV && location.evHourlyRate
            ? location.evHourlyRate
            : location.hourlyRate;

        const basePrice = Math.round(
          hourlyRate *
            duration *
            (Number(
              reservedSlot.pricingMultiplier
            ) || 1)
        );

        const evDiscount = isEV
          ? Math.min(
              Number(
                location.evIncentiveDiscount
              ) || 0,
              basePrice
            )
          : 0;

        const user =
          await User.findById(userId);

        const requestedPoints =
          redeemPoints
            ? Math.min(
                100,
                Math.max(
                  0,
                  Number(user?.ecoPoints) || 0
                )
              )
            : 0;

        const pointsDiscount = Math.min(
          Math.round(
            requestedPoints * 0.2
          ),
          Math.max(
            0,
            basePrice - evDiscount - 10
          )
        );

        const finalAmount = Math.max(
          10,
          basePrice -
            evDiscount -
            pointsDiscount
        );

        const bookingRef =
          await generateBookingRef();

        const qrToken =
          crypto
            .randomBytes(32)
            .toString('hex');

        const booking =
          await Booking.create({
            bookingReference:
              bookingRef,

            idempotencyKey:
              idempotencyKey ||
              undefined,

            qrToken,

            user: userId,
            vehicle: vehicle._id,

            location:
              location._id,

            slot:
              reservedSlot._id,

            startTime: start,
            endTime: end,

            durationHours: duration,

            basePrice,
            evDiscount,
            pointsDiscount,

            pointsToRedeem:
              pointsDiscount > 0
                ? requestedPoints
                : 0,

            finalAmount,

            paymentMethod:
              selectedMethod,

            paymentStatus: 'pending',

            bookingStatus:
              'confirmed',

            reservationState:
              'held',

            reservationExpiresAt,

            qrCodeData:
              `parkeasy://gate/${qrToken}`,

            ecoPointsEarned:
              isEV ? 50 : 15,
          });

        createdBookingId =
          booking._id;

        const linked =
          await ParkingSlot.findOneAndUpdate(
            {
              _id:
                reservedSlot._id,

              status:
                'Reserved',

              currentBooking:
                null,
            },
            {
              $set: {
                currentBooking:
                  booking._id,

                expectedFreeTime:
                  end,

                reservationExpiresAt,
              },
            },
            {
              new: true,
            }
          );

        if (!linked) {
          throw new Error(
            'Could not finalize slot reservation safely.'
          );
        }

        await syncLocationAvailability(
          location._id
        );

        await Payment.create({
          booking:
            booking._id,

          user:
            userId,

          amount:
            finalAmount,

          method:
            selectedMethod,

          transactionId:
            `PENDING-${bookingRef}`,

          status:
            'pending',

          gatewayResponse: {
            gateway:
              'ParkEasy Test Payment Gateway',

            mode:
              'SIMULATED',

            state:
              'PAYMENT_PENDING',

            holdExpiresAt:
              reservationExpiresAt,
          },
        });

        await Notification.create({
          user:
            userId,

          title:
            'Reservation Held — Payment Pending',

          message:
            `Slot ${reservedSlot.slotNumber} at ${location.name} is held for ${HOLD_MINUTES} minutes. Complete payment to confirm your parking pass.`,

          type:
            'booking',

          link:
            `/booking-details/${createdBookingId}`,
        });

        return booking;
      } catch (error) {
        if (createdBookingId) {
          await Payment
            .deleteOne({
              booking:
                createdBookingId,
            })
            .catch(() => {});

          await Notification
            .deleteMany({
              user:
                userId,

              link:
                `/booking-details/${createdBookingId}`,
            })
            .catch(() => {});

          await Booking
            .deleteOne({
              _id:
                createdBookingId,
            })
            .catch(() => {});
        }

        if (reservedSlot) {
          await ParkingSlot
            .findOneAndUpdate(
              {
                _id:
                  reservedSlot._id,

                status:
                  'Reserved',

                currentBooking:
                  null,
              },
              {
                $set: {
                  status:
                    'Available',

                  reservationExpiresAt:
                    null,

                  expectedFreeTime:
                    null,
                },
              }
            );

          await syncLocationAvailability(
            reservedSlot.location._id
          );
        }

        throw error;
      }
    };


    const booking =
      await runWithTransaction(
        createReservation,
        fallback
      );

    const responseBooking =
      await populateBooking(
        booking._id
      );

    emitSlotUpdate(
      req,
      responseBooking.slot,
      responseBooking.location._id
    );

    return res.status(201).json({
      success: true,

      message:
        `Slot reserved. Complete payment within ${HOLD_MINUTES} minutes.`,

      data:
        responseBooking,

      paymentHoldMinutes:
        HOLD_MINUTES,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET USER BOOKINGS
 */
exports.getUserBookings = async (
  req,
  res,
  next
) => {
  try {
    const { status } =
      req.query;

    const page = Math.max(
      1,
      Number(req.query.page) || 1
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number(req.query.limit) || 20
      )
    );

    const query = {
      user:
        req.user.id,
    };

    if (status === 'upcoming') {
      query.bookingStatus =
        'confirmed';

      query.startTime = {
        $gte: new Date(),
      };
    } else if (
      [
        'active',
        'completed',
        'cancelled',
      ].includes(status)
    ) {
      query.bookingStatus =
        status;
    } else if (status) {
      query.bookingStatus =
        status;
    }

    const [
      bookings,
      total,
    ] = await Promise.all([
      Booking.find(query)
        .populate(
          'location',
          'name address city images hourlyRate'
        )
        .populate(
          'slot',
          'slotNumber floor type evChargerType'
        )
        .populate(
          'vehicle',
          'licensePlate make model type isEV'
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (page - 1) * limit
        )
        .limit(limit),

      Booking.countDocuments(
        query
      ),
    ]);

    return res.status(200).json({
      success: true,

      count:
        bookings.length,

      total,

      page,

      limit,

      pages:
        Math.ceil(
          total / limit
        ),

      data:
        bookings,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET BOOKING BY ID
 */
exports.getBookingById = async (
  req,
  res,
  next
) => {
  try {
    const booking =
      await Booking.findById(
        req.params.id
      )
        .populate(
          'location',
          'name address city latitude longitude images hourlyRate amenities operatingHours'
        )
        .populate(
          'slot',
          'slotNumber floor type evChargerType expectedFreeTime reservationExpiresAt availabilitySource sensorStatus'
        )
        .populate(
          'vehicle',
          'licensePlate make model color type isEV'
        )
        .populate(
          'user',
          'name email phone'
        );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          'Booking not found',
      });
    }

    if (
      req.user.role === 'user' &&
      booking.user._id.toString() !==
        req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Unauthorized to view this booking',
      });
    }

    if (
      req.user.role === 'owner'
    ) {
      const owned =
        await ParkingLocation.exists({
          _id:
            booking.location._id,

          owner:
            req.user.id,
        });

      if (!owned) {
        return res.status(403).json({
          success: false,
          message:
            'Unauthorized to view this booking',
        });
      }
    }

    if (!booking.qrToken) {
      booking.qrToken =
        crypto
          .randomBytes(32)
          .toString('hex');

      booking.qrCodeData =
        `parkeasy://gate/${booking.qrToken}`;

      await booking.save();
    }

    const payment =
      await Payment.findOne({
        booking:
          booking._id,
      });

    return res.status(200).json({
      success: true,
      data: booking,
      payment,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * CANCEL BOOKING
 */
exports.cancelBooking = async (
  req,
  res,
  next
) => {
  try {
    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          'Booking not found',
      });
    }

    if (
      req.user.role === 'user' &&
      booking.user.toString() !==
        req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Unauthorized to cancel this booking',
      });
    }

    if (
      req.user.role === 'owner'
    ) {
      const owned =
        await ParkingLocation.exists({
          _id:
            booking.location,

          owner:
            req.user.id,
        });

      if (!owned) {
        return res.status(403).json({
          success: false,
          message:
            'Unauthorized to cancel this booking',
        });
      }
    }

    if (
      [
        'completed',
        'cancelled',
      ].includes(
        booking.bookingStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Booking is already ${booking.bookingStatus}.`,
      });
    }

    if (
      booking.bookingStatus ===
      'active'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'An active parking session must be checked out at the gate.',
      });
    }

    const wasPaid =
      booking.paymentStatus ===
      'completed';

    const result =
      await runWithTransaction(
        async (session) => {
          const updated =
            await Booking.findOneAndUpdate(
              {
                _id:
                  booking._id,

                bookingStatus: {
                  $nin: [
                    'completed',
                    'cancelled',
                  ],
                },
              },
              {
                $set: {
                  bookingStatus:
                    'cancelled',

                  paymentStatus:
                    wasPaid
                      ? 'refunded'
                      : 'failed',

                  reservationState:
                    wasPaid
                      ? 'released'
                      : 'expired',

                  reservationExpiresAt:
                    null,
                },
              },
              {
                new: true,
                session,
              }
            );

          if (!updated) {
            return null;
          }

          const slot =
            await ParkingSlot.findOneAndUpdate(
              {
                _id:
                  updated.slot,

                currentBooking:
                  updated._id,

                status:
                  'Reserved',
              },
              {
                $set: {
                  status:
                    'Available',

                  currentBooking:
                    null,

                  currentOccupant:
                    null,

                  expectedFreeTime:
                    null,

                  reservationExpiresAt:
                    null,

                  handoverRequested:
                    false,
                },
              },
              {
                new: true,
                session,
              }
            );

          if (slot) {
            await syncLocationAvailability(
              updated.location,
              session
            );
          }

          await Payment.updateOne(
            {
              booking:
                updated._id,

              status: {
                $in: [
                  'success',
                  'pending',
                  'processing',
                ],
              },
            },
            {
              $set: {
                status:
                  wasPaid
                    ? 'refunded'
                    : 'failed',

                gatewayResponse: {
                  gateway:
                    'ParkEasy Test Payment Gateway',

                  status:
                    wasPaid
                      ? 'REFUNDED_SIMULATED'
                      : 'CANCELLED',
                },
              },
            },
            {
              session,
            }
          );

          return {
            updated,
            slot,
          };
        },

        async () => {
          const updated =
            await Booking.findOneAndUpdate(
              {
                _id:
                  booking._id,

                bookingStatus: {
                  $nin: [
                    'completed',
                    'cancelled',
                  ],
                },
              },
              {
                $set: {
                  bookingStatus:
                    'cancelled',

                  paymentStatus:
                    wasPaid
                      ? 'refunded'
                      : 'failed',

                  reservationState:
                    wasPaid
                      ? 'released'
                      : 'expired',

                  reservationExpiresAt:
                    null,
                },
              },
              {
                new: true,
              }
            );

          if (!updated) {
            return null;
          }

          const slot =
            await ParkingSlot.findOneAndUpdate(
              {
                _id:
                  updated.slot,

                currentBooking:
                  updated._id,

                status:
                  'Reserved',
              },
              {
                $set: {
                  status:
                    'Available',

                  currentBooking:
                    null,

                  currentOccupant:
                    null,

                  expectedFreeTime:
                    null,

                  reservationExpiresAt:
                    null,

                  handoverRequested:
                    false,
                },
              },
              {
                new: true,
              }
            );

          if (slot) {
            await syncLocationAvailability(
              updated.location
            );
          }

          await Payment.updateOne(
            {
              booking:
                updated._id,

              status: {
                $in: [
                  'success',
                  'pending',
                  'processing',
                ],
              },
            },
            {
              $set: {
                status:
                  wasPaid
                    ? 'refunded'
                    : 'failed',
              },
            }
          );

          return {
            updated,
            slot,
          };
        }
      );

    if (!result) {
      return res.status(409).json({
        success: false,
        message:
          'Booking was already changed by another request.',
      });
    }

    if (result.slot) {
      emitSlotUpdate(
        req,
        result.slot,
        result.updated.location
      );
    }

    await Notification.create({
      user:
        result.updated.user,

      title:
        'Booking Cancelled',

      message:
        `Reservation ${result.updated.bookingReference} has been cancelled. ${
          wasPaid
            ? 'A simulated refund was recorded.'
            : 'No payment was captured.'
        }`,

      type:
        'booking',

      link:
        '/my-bookings',
    });

    return res.status(200).json({
      success: true,

      message:
        'Booking cancelled and slot released safely.',

      data:
        result.updated,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * VERIFY GATE PASS / QR
 */
exports.verifyGatePass = async (
  req,
  res,
  next
) => {
  try {
    const {
      qrToken,
      action,
      locationId,
    } = req.body;

    if (
      !qrToken ||
      !/^[a-f0-9]{32,128}$/i.test(
        qrToken
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'A valid secure QR token is required.',
      });
    }

    if (
      ![
        'check-in',
        'check-out',
      ].includes(action)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'A valid gate action is required.',
      });
    }

    const booking =
      await Booking.findOne({
        qrToken,
      })
        .populate(
          'location',
          'name owner'
        )
        .populate('slot')
        .populate('vehicle')
        .populate(
          'user',
          'name'
        );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          'Invalid QR pass.',
      });
    }

    const ownsLocation =
      booking.location.owner &&
      booking.location.owner.toString() ===
        req.user.id;

    if (
      req.user.role === 'user' &&
      booking.user._id.toString() !==
        req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          'This QR pass does not belong to your account.',
      });
    }

    if (
      req.user.role === 'owner' &&
      !ownsLocation
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You can only verify passes at your own parking location.',
      });
    }

    if (
      locationId &&
      booking.location._id.toString() !==
        String(locationId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'QR pass belongs to a different parking location.',
      });
    }

    if (
      booking.paymentStatus !==
      'completed'
    ) {
      return res.status(402).json({
        success: false,
        message:
          'Payment is not completed for this booking.',
      });
    }

    /**
     * CHECK-IN
     */
    if (action === 'check-in') {
      const now = Date.now();

      const earliest =
        new Date(
          booking.startTime
        ).getTime() -
        30 * 60 * 1000;

      const latest =
        new Date(
          booking.endTime
        ).getTime();

      if (now < earliest) {
        return res.status(400).json({
          success: false,
          message:
            'Entry is not open yet. You can check in up to 30 minutes before arrival.',
        });
      }

      if (now > latest) {
        return res.status(400).json({
          success: false,
          message:
            'This parking pass has expired.',
        });
      }

      const activated =
        await Booking.findOneAndUpdate(
          {
            _id:
              booking._id,

            bookingStatus:
              'confirmed',

            paymentStatus:
              'completed',
          },
          {
            $set: {
              bookingStatus:
                'active',

              reservationState:
                'confirmed',

              checkInTime:
                new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (!activated) {
        return res.status(409).json({
          success: false,
          message:
            'Check-in was already processed or booking state changed.',
        });
      }

      const occupied =
        await ParkingSlot.findOneAndUpdate(
          {
            _id:
              booking.slot._id,

            currentBooking:
              booking._id,

            status:
              'Reserved',
          },
          {
            $set: {
              status:
                'Occupied',

              currentOccupant:
                booking.user._id,

              reservationExpiresAt:
                null,
            },
          },
          {
            new: true,
          }
        );

      if (!occupied) {
        await Booking.updateOne(
          {
            _id:
              booking._id,

            bookingStatus:
              'active',
          },
          {
            $set: {
              bookingStatus:
                'confirmed',

              checkInTime:
                null,
            },
          }
        );

        return res.status(409).json({
          success: false,
          message:
            'The assigned slot is no longer in the expected reserved state. Check-in was not completed.',
        });
      }

      await syncLocationAvailability(
        booking.location._id
      );

      emitSlotUpdate(
        req,
        occupied,
        booking.location._id
      );

      await Notification.create({
        user:
          booking.user._id,

        title:
          'Entry Verified',

        message:
          `Welcome to ${booking.location.name}. Slot ${occupied.slotNumber} is now occupied.`,

        type:
          'booking',

        link:
          `/booking-details/${booking._id}`,
      });

      return res.status(200).json({
        success: true,

        action:
          'CHECK_IN_SUCCESS',

        message:
          `Entry verified. Slot ${occupied.slotNumber} is now occupied.`,

        booking:
          activated,
      });
    }


    /**
     * CHECK-OUT
     */
    const completed =
      await Booking.findOneAndUpdate(
        {
          _id:
            booking._id,

          bookingStatus:
            'active',

          paymentStatus:
            'completed',
        },
        {
          $set: {
            bookingStatus:
              'completed',

            reservationState:
              'completed',

            checkOutTime:
              new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!completed) {
      return res.status(409).json({
        success: false,
        message:
          'Only an active parking session can be checked out, and it can only be checked out once.',
      });
    }

    const freed =
      await ParkingSlot.findOneAndUpdate(
        {
          _id:
            booking.slot._id,

          currentBooking:
            booking._id,

          status:
            'Occupied',
        },
        {
          $set: {
            status:
              'Available',

            currentBooking:
              null,

            currentOccupant:
              null,

            expectedFreeTime:
              null,

            reservationExpiresAt:
              null,

            handoverRequested:
              false,
          },
        },
        {
          new: true,
        }
      );

    if (!freed) {
      await Booking.updateOne(
        {
          _id:
            booking._id,

          bookingStatus:
            'completed',
        },
        {
          $set: {
            bookingStatus:
              'active',

            reservationState:
              'confirmed',

            checkOutTime:
              null,
          },
        }
      );

      return res.status(409).json({
        success: false,
        message:
          'The assigned slot state changed unexpectedly. Check-out was not completed.',
      });
    }

    await syncLocationAvailability(
      booking.location._id
    );

    emitSlotUpdate(
      req,
      freed,
      booking.location._id
    );

    await Notification.create({
      user:
        booking.user._id,

      title:
        'Exit Verified',

      message:
        `Thank you for parking at ${booking.location.name}. Your session is complete.`,

      type:
        'booking',

      link:
        `/booking-details/${booking._id}`,
    });

    return res.status(200).json({
      success: true,

      action:
        'CHECK_OUT_SUCCESS',

      message:
        'Exit verified. Parking session completed.',

      booking:
        completed,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * IMPORTANT:
 * The controller functions above are declared using
 * exports.createBooking, exports.getUserBookings, etc.
 *
 * Therefore we must NOT write:
 *
 * createBooking,
 * getUserBookings,
 *
 * because those local variables do not exist.
 *
 * Use the exported properties explicitly.
 */
module.exports = {
  createBooking: exports.createBooking,
  getUserBookings: exports.getUserBookings,
  getBookingById: exports.getBookingById,
  cancelBooking: exports.cancelBooking,
  verifyGatePass: exports.verifyGatePass,
  emitSlotUpdate,
};