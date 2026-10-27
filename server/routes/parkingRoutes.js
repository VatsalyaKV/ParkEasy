const express = require('express');
const router = express.Router();
const {
  getParkingLocations,
  getParkingLocationById,
  createParkingLocation,
  updateParkingLocation,
  deleteParkingLocation,
} = require('../controllers/parkingController');
const { getSlotsByLocation } = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getParkingLocations)
  .post(protect, authorize('owner', 'admin'), createParkingLocation);

router.route('/:id')
  .get(getParkingLocationById)
  .put(protect, authorize('owner', 'admin'), updateParkingLocation)
  .delete(protect, authorize('owner', 'admin'), deleteParkingLocation);

// Nested route for slots of a specific parking facility
router.get('/:id/slots', getSlotsByLocation);

module.exports = router;
