
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },

    // Optional key used to prevent duplicate payment requests.
    // It is intentionally optional for seeded/demo payments.
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'processing', 'refunded'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Idempotency protection.
 *
 * Multiple seeded/demo payments can exist without an idempotencyKey.
 * When a real idempotencyKey is supplied, the same user cannot create
 * another payment using that same key.
 */
paymentSchema.index(
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

// User payment history
paymentSchema.index({
  user: 1,
  createdAt: -1,
});

// Payment status/history queries
paymentSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model('Payment', paymentSchema);

