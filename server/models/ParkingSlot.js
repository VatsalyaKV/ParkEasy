const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLocation', required: true, index: true },
    slotNumber: { type: String, required: true, trim: true },
    floor: { type: String, enum: ['Ground Floor', '1st Floor', 'Basement 1', 'Basement 2'], default: 'Ground Floor' },
    type: { type: String, enum: ['Regular', 'EV', 'Accessible', 'VIP'], default: 'Regular' },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Occupied', 'Handover_Pending', 'Upcoming', 'Maintenance'],
      default: 'Available',
      index: true,
    },
    currentBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
    currentOccupant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    expectedFreeTime: { type: Date, default: null },
    reservationExpiresAt: { type: Date, default: null, index: true },
    handoverRequested: { type: Boolean, default: false },
    evChargerType: { type: String, enum: ['None', 'Type 2 AC (7.4 kW)', 'CCS2 Fast DC (50 kW)', 'GB/T (22 kW)'], default: 'None' },
    pricingMultiplier: { type: Number, default: 1.0, min: 0.1, max: 10 },
    availabilitySource: { type: String, enum: ['application', 'sensor', 'camera'], default: 'application' },
    sensorStatus: { type: String, enum: ['not_connected', 'online', 'offline'], default: 'not_connected' },
  },
  { timestamps: true }
);

parkingSlotSchema.index({ location: 1, slotNumber: 1 }, { unique: true });
parkingSlotSchema.index({ location: 1, status: 1 });
parkingSlotSchema.index({ location: 1, type: 1, status: 1 });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
