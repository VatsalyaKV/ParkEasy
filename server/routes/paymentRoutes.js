const express = require('express');
const router = express.Router();
const { processPayment, getPaymentById } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', processPayment);
router.get('/:id', getPaymentById);

module.exports = router;
