const express = require('express');
const router = express.Router();
const authController = require('../../controllers/User/userAuthController');
const userAuth = require('../../middleware/userAuth');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/profile', userAuth, authController.getUserProfile);
router.get('/upcoming-events', userAuth, authController.getUpcomingEvents);
router.get('/attended-events', userAuth, authController.getAttendedEvents);
router.post('/register-event', userAuth, authController.registerForEvent);
router.post('/check-location', userAuth, authController.checkLocation);
router.post('/mark-attendance', userAuth, authController.markAttendance);

module.exports = router;
