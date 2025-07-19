const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middlewares/requireAdmin');
const userController = require('../../controllers/admin/userController');

router.get('/', requireAdmin, userController.getAllUsers);
router.put('/:id/role', requireAdmin, userController.updateUserRole);
router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;
