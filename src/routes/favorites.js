const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/clerk-sdk-node/express');
const favoritesController = require('../controllers/favoritesController');


router.use(requireAuth());
router.get('/', favoritesController.getFavorites);
router.post('/', favoritesController.addToFavorites);
router.delete('/:mediaId', favoritesController.removeFromFavorites);

module.exports = router;
