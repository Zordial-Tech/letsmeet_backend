const express = require('express');
const settingController = require('../../controllers/Admin/settingController');

const router = express.Router();

// Define routes for reports
router.get('/connection-status', settingController.checkConnectionStatus);
router.put('/connection-status', settingController.toggleConnectionStatus);
router.get('/check-in-distance', settingController.getCheckInDistance);
router.put('/check-in-distance', settingController.updateCheckInDistance);

module.exports = router;
