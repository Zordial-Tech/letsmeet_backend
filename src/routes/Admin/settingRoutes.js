const express = require('express');
const settingController = require('../../controllers/Admin/settingController');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

// Define routes for reports
router.get('/connection-status',adminAuth.verifyToken,  settingController.checkConnectionStatus);
router.put('/connection-status',adminAuth.verifyToken,  settingController.toggleConnectionStatus);
router.get('/check-in-distance',adminAuth.verifyToken,  settingController.getCheckInDistance);
router.put('/check-in-distance',adminAuth.verifyToken,  settingController.updateCheckInDistance);

module.exports = router;
