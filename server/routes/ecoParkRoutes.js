const express = require('express');
const router = express.Router();
const {
  getEcoParkSummary,
  getRewardHistory,
  redeemReward,
} = require('../controllers/ecoParkController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getEcoParkSummary);
router.get('/rewards', getRewardHistory);
router.post('/redeem', redeemReward);

module.exports = router;
