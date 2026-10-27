const express = require('express');
const router = express.Router();
const {
  getVehicles,
  addVehicle,
  deleteVehicle,
  setDefaultVehicle,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getVehicles)
  .post(addVehicle);

router.route('/:id')
  .delete(deleteVehicle);

router.put('/:id/default', setDefaultVehicle);

module.exports = router;
