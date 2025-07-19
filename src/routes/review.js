// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/:mediaId', reviewController.getReviewsForMedia);
router.post('/', reviewController.addReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
