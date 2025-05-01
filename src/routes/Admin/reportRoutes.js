const express = require('express');
const reportController = require('../../controllers/Admin/reportController');

const router = express.Router();

// Define routes for reports
router.get('/', reportController.getAllReports); // Get all reports
router.post('/', reportController.createReport); // Create a new report

module.exports = router;
