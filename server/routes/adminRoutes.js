const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAdminAnalytics,
  getAllUsers,
  toggleUserStatus,
  getAllLocations,
  toggleLocationApproval,
  getAllBookings,
  updateBookingStatus,
  getAllPayments,
  refundPayment,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/analytics', getAdminAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/locations', getAllLocations);
router.put('/locations/:id/toggle-approval', toggleLocationApproval);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.get('/payments', getAllPayments);
router.put('/payments/:id/refund', refundPayment);

module.exports = router;
