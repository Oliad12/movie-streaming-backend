const express = require('express');
const router = express.Router();
const {
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  createMedia,
} = require('../../controllers/admin/mediaController');


router.get('/', getAllMedia);
router.get('/:id', getMediaById);
router.put('/:id',  updateMedia);
router.delete('/:id', deleteMedia);
router.post('/',  createMedia);

module.exports = router;
