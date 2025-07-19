const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { requireAuth } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/', subscriptionController.getSubscription);
router.post('/', subscriptionController.createSubscription);
router.put('/cancel', subscriptionController.cancelSubscription);

module.exports = router;
