const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');



router.get('/', mediaController.getAllMedia);
router.get('/:id', mediaController.getMediaById);
router.post('/', mediaController.createMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
