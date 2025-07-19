const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const userController  = require('../controllers/userController');

router.use(requireAuth);

router.get('/me', requireAuth(), userController.getCurrentUser);
router.post('/create-user', requireAuth(), userController.createUser);
router.put('/update', requireAuth(), userController.updateProfile);
router.get('/all', requireAuth(), userController.getAllUsers);
router.delete('/:userId', requireAuth(), userController.deleteUser);

module.exports = router;
