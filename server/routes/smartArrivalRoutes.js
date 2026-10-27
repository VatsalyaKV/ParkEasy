const express = require('express');
const router = express.Router();
const { getRecommendation } = require('../controllers/smartArrivalController');

router.post('/', getRecommendation);

module.exports = router;
