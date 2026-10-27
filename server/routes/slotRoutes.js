const express = require('express');
const router = express.Router();
const {
  createSlot,
  updateSlot,
  bulkGenerateSlots,
} = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('owner', 'admin'), createSlot);
router.put('/:id', protect, authorize('owner', 'admin'), updateSlot);
router.post('/bulk', protect, authorize('owner', 'admin'), bulkGenerateSlots);

module.exports = router;
