const express = require('express');
const { generateQRCode } = require('../../controllers/Admin/qrController');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.post('/generate', verifyToken, generateQRCode);

module.exports = router;
