const mongoose = require('mongoose');

const handoverRequestSchema = new mongoose.Schema(
  {
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', required: true, index: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLocation', required: true, index: true },
    currentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    expectedDepartureTime: { type: Date, required: true, index: true },
    waitingUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    waitingVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    status: { type: String, enum: ['Expected_Soon', 'Handover_Requested', 'Handover_Confirmed', 'Completed', 'Cancelled'], default: 'Expected_Soon', index: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

handoverRequestSchema.index({ slot: 1, currentBookingId: 1, status: 1 });
handoverRequestSchema.index({ location: 1, status: 1, expectedDepartureTime: 1 });
module.exports = mongoose.model('HandoverRequest', handoverRequestSchema);
