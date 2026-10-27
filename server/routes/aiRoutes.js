const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { parkingAssistant } = require('../controllers/aiController');

router.post('/parking-assistant', protect, parkingAssistant);

module.exports = router;
