const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  verifyGatePass,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/verify-gate-pass', verifyGatePass);

router.route('/')
  .post(createBooking)
  .get(getUserBookings);

router.route('/:id')
  .get(getBookingById);

router.put('/:id/cancel', cancelBooking);

module.exports = router;
