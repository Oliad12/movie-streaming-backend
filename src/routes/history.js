const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const historyController = require('../controllers/historyController');

router.get('/', requireAuth, historyController.getHistory);
router.post('/', requireAuth, historyController.addToHistory);
router.delete('/:mediaId', requireAuth, historyController.removeFromHistory);
router.delete('/', requireAuth, historyController.clearHistory);

module.exports = router;
