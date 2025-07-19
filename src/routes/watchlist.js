const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/clerk-sdk-node/express');
const watchlistController = require('../controllers/watchlistController');

router.use(requireAuth);

router.get('/', watchlistController.getWatchlist);
router.post('/', watchlistController.addToWatchlist);
router.delete('/:mediaId', watchlistController.removeFromWatchlist);

module.exports = router;
