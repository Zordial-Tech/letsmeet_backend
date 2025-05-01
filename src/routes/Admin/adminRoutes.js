const express = require('express');
const adminController = require('../../controllers/Admin/adminController');
const { verifyToken, isAdmin } = require('../../middleware/auth');

const router = express.Router();

router.post('/roles',  adminController.addRole);
router.delete('/roles/:id', adminController.deleteRole);
router.get('/roles',  adminController.getRoles);

module.exports = router;
