const express = require('express');
const { getRecommendations } = require('../../controllers/Admin/aiController');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

router.get('/recommendations/:userId', verifyToken, getRecommendations);

module.exports = router;
