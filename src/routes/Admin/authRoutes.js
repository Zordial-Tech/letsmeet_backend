const express = require('express');
const router = express.Router();
const adminlogin = require('../../controllers/Admin/adminlogin');

router.post('/register', adminlogin.registerAdmin);
router.post('/login', adminlogin.loginAdmin);

module.exports = router;
