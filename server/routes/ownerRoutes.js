const express = require('express');
const router = express.Router();
const {
  getOwnerDashboard,
  getOwnerReservations,
  getOwnerUsers,
  getOwnerRevenue,
} = require('../controllers/ownerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('owner', 'admin'));

router.get('/dashboard', getOwnerDashboard);
router.get('/reservations', getOwnerReservations);
router.get('/users', getOwnerUsers);
router.get('/revenue', getOwnerRevenue);

module.exports = router;
