const express = require('express');
const adminController = require('../../controllers/Admin/adminController');
const { verifyToken, isAdmin } = require('../../middleware/adminAuth');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.post('/roles',adminAuth.verifyToken,   adminController.addRole);
router.delete('/roles/:id',adminAuth.verifyToken,  adminController.deleteRole);
router.get('/roles',adminAuth.verifyToken,   adminController.getRoles);

module.exports = router;
