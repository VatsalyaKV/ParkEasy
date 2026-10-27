const mongoose = require('mongoose');

const parkingLocationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Parking location name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: 'Smart automated multi-tier parking facility with 24/7 security and EV fast chargers.',
    },
    address: {
      type: String,
      required: [true, 'Street address is required'],
    },
    city: {
      type: String,
      required: true,
      default: 'Bengaluru',
    },
    state: {
      type: String,
      default: 'Karnataka',
    },
    postalCode: {
      type: String,
      default: '560001',
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (value) => !value || /^https?:\/\//i.test(value),
        message: 'Website URL must start with http:// or https://',
      },
    },
    latitude: {
      type: Number,
      required: true,
      default: 12.9716,
    },
    longitude: {
      type: Number,
      required: true,
      default: 77.5946,
    },
    hourlyRate: {
      type: Number,
      required: true,
      default: 40,
    },
    evHourlyRate: {
      type: Number,
      default: 30, // Discounted for EVs
    },
    evIncentiveDiscount: {
      type: Number,
      default: 20, // ₹20 off for EV users as part of EcoPark
    },
    totalSlots: {
      type: Number,
      default: 20,
    },
    availableSlots: {
      type: Number,
      default: 20,
    },
    amenities: {
      type: [String],
      default: ['EV Charging', 'CCTV 24/7', 'Covered Roof', 'Disabled Access', 'Security Staff', 'Automated Boom Barrier'],
    },
    images: {
      type: [String],
      default: [
        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1000&q=80',
      ],
    },
    operatingHours: {
      type: String,
      default: '24 Hours Open',
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: null,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isVerifiedDestination: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

parkingLocationSchema.index({ owner: 1, createdAt: -1 });
parkingLocationSchema.index({ isApproved: 1, city: 1 });
parkingLocationSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('ParkingLocation', parkingLocationSchema);
