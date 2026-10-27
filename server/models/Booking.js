
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    // Optional key used to prevent duplicate booking requests.
    // It is intentionally optional for seeded/demo bookings.
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },

    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLocation',
      required: true,
      index: true,
    },

    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: true,
      index: true,
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    durationHours: {
      type: Number,
      required: true,
      default: 2,
      min: 0.5,
      max: 24,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    evDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    pointsDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'refunded', 'failed'],
      default: 'pending',
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ['Card', 'UPI', 'NetBanking', 'EcoPoints'],
      default: 'UPI',
    },

    bookingStatus: {
      type: String,
      enum: ['confirmed', 'active', 'completed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },

    reservationState: {
      type: String,
      enum: ['held', 'confirmed', 'released', 'expired', 'completed'],
      default: 'held',
      index: true,
    },

    reservationExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    expiredAt: {
      type: Date,
      default: null,
    },

    expirationReason: {
      type: String,
      default: '',
    },

    qrCodeData: {
      type: String,
      required: true,
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    isHandoverOffered: {
      type: Boolean,
      default: false,
    },

    ecoPointsEarned: {
      type: Number,
      default: 20,
      min: 0,
    },

    pointsToRedeem: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Idempotency protection
 *
 * A user can have multiple normal bookings where idempotencyKey
 * is not provided.
 *
 * When an actual idempotencyKey is supplied, the combination of
 * user + idempotencyKey must be unique.
 *
 * This prevents accidental duplicate booking requests while
 * allowing seeded/demo bookings without an idempotency key.
 */
bookingSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: {
        $type: 'string',
      },
    },
  }
);

// User booking history
bookingSchema.index({
  user: 1,
  createdAt: -1,
});

// Location booking availability queries
bookingSchema.index({
  location: 1,
  bookingStatus: 1,
  startTime: 1,
});

// Reservation expiry/payment cleanup queries
bookingSchema.index({
  reservationExpiresAt: 1,
  paymentStatus: 1,
  bookingStatus: 1,
});

module.exports = mongoose.model('Booking', bookingSchema);

