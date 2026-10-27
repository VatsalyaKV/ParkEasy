const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    licensePlate: {
      type: String,
      required: [true, 'Please provide vehicle registration plate number'],
      uppercase: true,
      trim: true,
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Car', 'SUV', 'EV', 'Bike'],
      default: 'Car',
    },
    color: {
      type: String,
      default: 'White',
    },
    isEV: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
