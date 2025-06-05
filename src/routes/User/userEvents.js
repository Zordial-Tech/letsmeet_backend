const express = require('express');
const router = express.Router();
const userEventController = require('../../controllers/User/userEventController');
const userAuth = require('../../middleware/userAuth');


router.post('/upcoming-events', userAuth, userEventController.getAllUpcomingEvents);
router.post('/register-event', userAuth, userEventController.registerForEvent);
router.post('/check-in', userAuth, userEventController.checkInToEvent);
router.get('/registered-events', userAuth, userEventController.getRegisteredEventsWithConnections);
router.get('/attended-users', userAuth, userEventController.getUsersFromSharedPastEvents);

// router.get('/attended-events', userAuth, userEventController.getAttendedEvents);
// router.post('/register-event', userAuth, authController.registerForEvent);
// router.post('/check-location', userAuth, authController.checkLocation);
// router.post('/mark-attendance', userAuth, authController.markAttendance);

module.exports = router;