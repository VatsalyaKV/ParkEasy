const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const HandoverRequest = require('../models/HandoverRequest');
const Notification = require('../models/Notification');
const EcoReward = require('../models/EcoReward');

/*
|--------------------------------------------------------------------------
| VERIFIED PARKING DESTINATIONS
|--------------------------------------------------------------------------
| These are application listings used by ParkEasy.
| Availability is generated application data and is NOT live sensor data.
|--------------------------------------------------------------------------
*/

const verifiedDestinations = [
  {
    name: 'UB City',
    description:
      'ParkEasy destination listing for UB City. Availability, rates and booking states are application data and are not live mall sensor data.',
    address: '24 Vittal Mallya Road, UB City',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',

    latitude: 12.97175,
    longitude: 77.59583,

    hourlyRate: 50,
    evHourlyRate: 40,
    evIncentiveDiscount: 10,

    totalSlots: 20,

    amenities: [
      'Parking',
      'CCTV',
      'EV Charging',
    ],

    operatingHours:
      'Destination hours vary; verify current hours with the official venue',

    isApproved: true,
    isVerifiedDestination: true,
  },

  {
    name: 'Forum South Bengaluru',
    description:
      'ParkEasy destination listing for Forum South Bengaluru. Availability, rates and booking states are application data and are not live mall sensor data.',
    address:
      'Konanakunte Cross Metro Station, Anjanadri Layout, Konanakunte',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560062',

    latitude: 12.88835,
    longitude: 77.56331,

    hourlyRate: 45,
    evHourlyRate: 35,
    evIncentiveDiscount: 10,

    totalSlots: 20,

    amenities: [
      'Parking',
      'EV Charging',
      'Valet Service',
    ],

    operatingHours: '10:00 AM - 10:00 PM',

    websiteUrl:
      'https://www.forummalls.in/pages/forum-south-bengaluru',

    isApproved: true,
    isVerifiedDestination: true,
  },

  {
    name: 'Phoenix Marketcity Bengaluru',
    description:
      'ParkEasy destination listing for Phoenix Marketcity Bengaluru. Availability, rates and booking states are application data and are not live mall sensor data.',
    address:
      'Whitefield Main Road, Devasandra Industrial Estate, Mahadevapura',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560048',

    latitude: 12.995854,
    longitude: 77.69635,

    hourlyRate: 60,
    evHourlyRate: 45,
    evIncentiveDiscount: 10,

    totalSlots: 24,

    amenities: [
      'Parking',
      'CCTV',
      'EV Charging',
    ],

    operatingHours:
      'Verify current destination hours with the official venue',

    websiteUrl:
      'https://www.phoenixmarketcity.com/bangalore',

    isApproved: true,
    isVerifiedDestination: true,
  },
];

/*
|--------------------------------------------------------------------------
| DEMO ACCOUNTS
|--------------------------------------------------------------------------
*/

const demoAccounts = [
  {
    name: 'ParkEasy Admin',
    email: 'admin@parkeasy.demo',
    password: 'Admin@12345',
    role: 'admin',
    phone: '+91 90000 00001',
    ecoPoints: 0,
  },

  {
    name: 'ParkEasy Owner',
    email: 'owner@parkeasy.demo',
    password: 'Owner@12345',
    role: 'owner',
    phone: '+91 90000 00002',
    ecoPoints: 0,
  },

  {
    name: 'ParkEasy Driver',
    email: 'driver@parkeasy.demo',
    password: 'Driver@12345',
    role: 'user',
    phone: '+91 90000 00003',
    ecoPoints: 180,
  },
];

/*
|--------------------------------------------------------------------------
| CREATE / UPDATE DEMO USERS
|--------------------------------------------------------------------------
*/

async function upsertDemoAccounts() {
  const users = {};

  for (const account of demoAccounts) {
    const password = await bcrypt.hash(account.password, 10);

    const user = await User.findOneAndUpdate(
      {
        email: account.email,
      },

      {
        $set: {
          name: account.name,
          password,
          role: account.role,
          phone: account.phone,
          ecoPoints: account.ecoPoints,
          isActive: true,
        },
      },

      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    users[account.role] = user;
  }

  return users;
}

/*
|--------------------------------------------------------------------------
| CREATE PARKING SLOTS
|--------------------------------------------------------------------------
*/

async function createSlots(location, prefix, total) {
  const slots = [];

  // Approximately 20% EV slots.
  const evCount = Math.max(
    1,
    Math.ceil(total * 0.2)
  );

  for (let i = 1; i <= total; i += 1) {
    const isEV = i <= evCount;

    // Last non-EV slot becomes accessible.
    const isAccessible =
      !isEV && i === total;

    let type = 'Regular';

    if (isEV) {
      type = 'EV';
    } else if (isAccessible) {
      type = 'Accessible';
    }

    slots.push({
      location: location._id,

      slotNumber:
        `${prefix}-${String(i).padStart(2, '0')}`,

      floor:
        i > Math.ceil(total / 2)
          ? 'Basement 1'
          : 'Ground Floor',

      type,

      evChargerType:
        isEV
          ? 'CCS2 Fast DC (50 kW)'
          : 'None',

      status: 'Available',

      pricingMultiplier: 1,

      currentBooking: null,

      currentOccupant: null,

      expectedFreeTime: null,

      handoverRequested: false,
    });
  }

  return ParkingSlot.insertMany(slots);
}

/*
|--------------------------------------------------------------------------
| CREATE DEMO BOOKING
|--------------------------------------------------------------------------
*/

async function createDemoBooking({
  user,
  vehicle,
  location,
  slot,
  status,
  startTime,
  durationHours,
  paymentStatus = 'completed',
}) {
  const start = new Date(startTime);

  const end = new Date(
    start.getTime() +
      durationHours * 60 * 60 * 1000
  );

  const isEV =
    Boolean(vehicle.isEV) ||
    slot.type === 'EV';

  const hourlyRate = isEV
    ? location.evHourlyRate
    : location.hourlyRate;

  const basePrice = Math.round(
    hourlyRate * durationHours
  );

  const evDiscount = isEV
    ? Math.min(
        location.evIncentiveDiscount || 0,
        basePrice
      )
    : 0;

  const finalAmount = Math.max(
    10,
    basePrice - evDiscount
  );

  const bookingReference =
    `PE-SEED-${slot.slotNumber}-${Date.now()}-${crypto.randomInt(
      0,
      1000
    )}`;

  const qrToken =
    crypto.randomBytes(24).toString('hex');

  const booking = await Booking.create({
    bookingReference,

    qrToken,

    user: user._id,

    vehicle: vehicle._id,

    location: location._id,

    slot: slot._id,

    startTime: start,

    endTime: end,

    durationHours,

    basePrice,

    evDiscount,

    finalAmount,

    paymentMethod: 'UPI',

    paymentStatus,

    bookingStatus: status,

    qrCodeData:
      `parkeasy://gate/${qrToken}`,

    ecoPointsEarned:
      isEV ? 50 : 15,
  });

  /*
   * Create simulated successful payment
   * for seeded completed/active/upcoming bookings.
   */

  if (paymentStatus === 'completed') {
    await Payment.create({
      booking: booking._id,

      user: user._id,

      amount: finalAmount,

      method: 'UPI',

      transactionId:
        `TXN-SEED-${booking._id}`,

      status: 'success',

      gatewayResponse: {
        gateway:
          'ParkEasy Test Payment Gateway',

        status: 'PAID_SIMULATED',
      },
    });
  }

  /*
   * Update slot state for active/confirmed bookings.
   */

  if (
    status !== 'completed' &&
    status !== 'cancelled'
  ) {
    slot.status =
      status === 'active'
        ? 'Occupied'
        : 'Reserved';

    slot.currentBooking =
      booking._id;

    slot.currentOccupant =
      status === 'active'
        ? user._id
        : null;

    slot.expectedFreeTime = end;

    await slot.save();
  }

  return booking;
}

/*
|--------------------------------------------------------------------------
| MAIN SEED FUNCTION
|--------------------------------------------------------------------------
*/

async function seedDatabase() {
  try {
    console.log('\n========================================');
    console.log('      ParkEasy Database Seeder');
    console.log('========================================\n');

    const mongoUri =
      process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI is missing from server/.env'
      );
    }

    /*
     * Connect to MongoDB Atlas.
     */

    await mongoose.connect(mongoUri);

    console.log(
      '[Seed] Connected to MongoDB.'
    );

    /*
     * Create / update demo accounts.
     */

    const demo =
      await upsertDemoAccounts();

    console.log(
      '[Seed] Demo accounts ready.'
    );

    /*
     * IMPORTANT:
     *
     * Rebuild only ParkEasy application data.
     * Registered users are preserved.
     */

    await Promise.all([
      ParkingSlot.deleteMany({}),

      ParkingLocation.deleteMany({}),

      Booking.deleteMany({}),

      Payment.deleteMany({}),

      HandoverRequest.deleteMany({}),

      Notification.deleteMany({}),

      EcoReward.deleteMany({}),
    ]);

    console.log(
      '[Seed] Previous ParkEasy application data cleared.'
    );

    /*
     * Create verified parking locations.
     */

    const locations = [];

    for (
      let i = 0;
      i < verifiedDestinations.length;
      i += 1
    ) {
      const source =
        verifiedDestinations[i];

      const location =
        await ParkingLocation.create({
          ...source,

          owner: demo.owner._id,

          images: [],
        });

      /*
       * A = UB City
       * B = Forum South
       * C = Phoenix Marketcity
       */

      const prefix =
        String.fromCharCode(65 + i);

      const slots =
        await createSlots(
          location,
          prefix,
          source.totalSlots
        );

      location.totalSlots =
        slots.length;

      location.availableSlots =
        slots.length;

      await location.save();

      locations.push({
        location,
        slots,
      });

      console.log(
        `[Seed] ${location.name}: ${slots.length} slots created.`
      );
    }

    /*
     * Driver demo vehicles.
     */

    const driver =
      demo.user;

    /*
     * Remove only previously seeded/demo vehicles
     * for this demo driver.
     */

    await Vehicle.deleteMany({
      user: driver._id,
    });

    const driverVehicles =
      await Vehicle.insertMany([
        {
          user: driver._id,

          licensePlate:
            'KA-01-EV-2026',

          make: 'Tata',

          model: 'Nexon EV',

          type: 'EV',

          color: 'Blue',

          isEV: true,

          isDefault: true,
        },

        {
          user: driver._id,

          licensePlate:
            'KA-05-PE-1026',

          make: 'Hyundai',

          model: 'i20',

          type: 'Car',

          color: 'White',

          isEV: false,

          isDefault: false,
        },
      ]);

    console.log(
      '[Seed] Demo vehicles created.'
    );

    /*
     * Active booking at UB City.
     */

    const active =
      await createDemoBooking({
        user: driver,

        vehicle:
          driverVehicles[0],

        location:
          locations[0].location,

        slot:
          locations[0].slots[1],

        status: 'active',

        startTime:
          new Date(
            Date.now() -
              30 * 60 * 1000
          ),

        durationHours: 2,
      });

    /*
     * Upcoming booking at Forum South.
     */

    await createDemoBooking({
      user: driver,

      vehicle:
        driverVehicles[1],

      location:
        locations[1].location,

      slot:
        locations[1].slots[2],

      status: 'confirmed',

      startTime:
        new Date(
          Date.now() +
            2 * 60 * 60 * 1000
        ),

      durationHours: 3,
    });

    /*
     * Completed booking at Phoenix Marketcity.
     */

    await createDemoBooking({
      user: driver,

      vehicle:
        driverVehicles[0],

      location:
        locations[2].location,

      slot:
        locations[2].slots[3],

      status: 'completed',

      startTime:
        new Date(
          Date.now() -
            24 * 60 * 60 * 1000
        ),

      durationHours: 2,
    });

    /*
     * Restore completed slot to Available.
     */

    const completedSlot =
      locations[2].slots[3];

    completedSlot.status =
      'Available';

    completedSlot.currentBooking =
      null;

    completedSlot.currentOccupant =
      null;

    completedSlot.expectedFreeTime =
      null;

    completedSlot.handoverRequested =
      false;

    await completedSlot.save();

    /*
     * Create handover opportunity
     * for the active UB City booking.
     */

    const handover =
      await HandoverRequest.create({
        slot:
          locations[0].slots[1]._id,

        location:
          locations[0].location._id,

        currentUserId:
          driver._id,

        currentBookingId:
          active._id,

        expectedDepartureTime:
          new Date(
            Date.now() +
              20 * 60 * 1000
          ),

        status:
          'Expected_Soon',

        notes:
          'Demo handover opportunity for the university presentation.',
      });

    await ParkingSlot.findByIdAndUpdate(
      active.slot,
      {
        $set: {
          expectedFreeTime:
            handover.expectedDepartureTime,

          handoverRequested:
            false,

          status:
            'Handover_Pending',
        },
      }
    );

    /*
     * Recalculate availability from actual slot states.
     */

    for (const item of locations) {
      const availableSlots =
        await ParkingSlot.countDocuments({
          location:
            item.location._id,

          status:
            'Available',
        });

      await ParkingLocation.findByIdAndUpdate(
        item.location._id,
        {
          $set: {
            availableSlots,
          },
        }
      );

      console.log(
        `[Seed] ${item.location.name}: ${availableSlots}/${item.slots.length} slots available.`
      );
    }

    /*
     * Notifications.
     */

    await Notification.create({
      user: driver._id,

      title:
        'Demo booking ready',

      message:
        `Your active demo booking is ${active.bookingReference}.`,

      type:
        'booking',

      link:
        `/booking-details/${active._id}`,
    });

    await Notification.create({
      user: driver._id,

      title:
        'Handover opportunity',

      message:
        `Slot ${locations[0].slots[1].slotNumber} is expected to be free soon.`,

      type:
        'handover',

      link:
        '/handover',
    });

    /*
     * EcoPark rewards.
     */

    await EcoReward.create({
      user: driver._id,

      pointsEarned: 50,

      booking: active._id,

      reason:
        'Seeded EcoPark EV parking reward',
    });

    await EcoReward.create({
      user: driver._id,

      pointsSpent: 20,

      reason:
        'Seeded EcoPark reward redemption',
    });

    /*
     * Final summary.
     */

    const totalLocations =
      await ParkingLocation.countDocuments();

    const totalSlots =
      await ParkingSlot.countDocuments();

    const availableSlots =
      await ParkingSlot.countDocuments({
        status: 'Available',
      });

    console.log(
      '\n========================================'
    );

    console.log(
      '[Seed] ParkEasy demo data created successfully.'
    );

    console.log(
      '========================================'
    );

    console.log(
      `Locations : ${totalLocations}`
    );

    console.log(
      `Total Slots: ${totalSlots}`
    );

    console.log(
      `Available  : ${availableSlots}`
    );

    console.log(
      '\nDemo Accounts:'
    );

    console.log(
      'Admin : admin@parkeasy.demo / Admin@12345'
    );

    console.log(
      'Owner : owner@parkeasy.demo / Owner@12345'
    );

    console.log(
      'User  : driver@parkeasy.demo / Driver@12345'
    );

    console.log(
      '\nIncluded:'
    );

    console.log(
      '- Verified Bengaluru destinations'
    );

    console.log(
      '- Regular parking slots'
    );

    console.log(
      '- EV parking slots'
    );

    console.log(
      '- Accessible parking'
    );

    console.log(
      '- Demo bookings'
    );

    console.log(
      '- Simulated payments'
    );

    console.log(
      '- QR booking data'
    );

    console.log(
      '- Parking handover'
    );

    console.log(
      '- Notifications'
    );

    console.log(
      '- EcoPark rewards'
    );

    console.log(
      '\n[Seed] Availability is application/demo data, not live sensor data.'
    );

    console.log(
      '[Seed] Database seeding completed successfully.\n'
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      '\n[Seed Error]',
      error
    );

    await mongoose
      .disconnect()
      .catch(() => {});

    process.exit(1);
  }
}

/*
|--------------------------------------------------------------------------
| START SEED
|--------------------------------------------------------------------------
*/

seedDatabase();