const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getVehicles,
  addVehicle,
  deleteVehicle,
  setDefaultVehicle,
  getUserStats,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard-stats', getUserStats);

module.exports = router;
