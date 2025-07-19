const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middlewares/auth');

router.use(requireAuth);

router.post('/intent/stripe', paymentController.createStripePaymentIntent);
router.post('/intent/chapa', paymentController.createChapaPaymentLink);

router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);
router.post('/webhook/chapa', paymentController.handleChapaWebhook);

router.get('/', paymentController.getUserPayments);

module.exports = router;
