const express = require('express');
const router = express.Router();
const {
  getAvailableHandovers,
  announceDeparture,
  requestHandover,
  confirmDeparture,
} = require('../controllers/handoverController');
const { protect } = require('../middleware/auth');

router.get('/', getAvailableHandovers);

router.use(protect);
router.post('/announce-departure', announceDeparture);
router.post('/:id/request', requestHandover);
router.post('/:id/confirm-departure', confirmDeparture);

module.exports = router;
