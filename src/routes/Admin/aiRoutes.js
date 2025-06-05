const express = require('express');
const router = require('express');
const { getRecommendations } = require('../../controllers/Admin/aiController');
const adminlogin = require('../../controllers/Admin/adminlogin');

const router = express.Router();

router.get('/recommendations/:userId',adminAuth.verifyToken,  getRecommendations);

module.exports = router;
