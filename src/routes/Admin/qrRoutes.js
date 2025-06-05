const express = require('express');
const { generateQRCode } = require('../../controllers/Admin/qrController');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.post('/generate',adminAuth.verifyToken,  generateQRCode);

module.exports = router;
