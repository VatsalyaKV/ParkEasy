const mongoose = require('mongoose');

const ecoRewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    pointsSpent: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    carbonOffsetKg: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EcoReward', ecoRewardSchema);
