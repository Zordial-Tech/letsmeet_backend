const express = require('express');
const reportController = require('../../controllers/Admin/reportController');
const adminAuth = require('../../middleware/adminAuth');
const router = express.Router();

// Define routes for reports

router.get('/reports',adminAuth.verifyToken,  reportController.getReports);
router.put('/reports/update-status/:id',adminAuth.verifyToken,  reportController.updateReportStatus);

module.exports = router;
