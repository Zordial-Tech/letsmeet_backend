const express = require('express');
const router = express.Router();
const EventController = require('../../controllers/Admin/eventController');

router.post('/create', EventController.createEvent);
router.get('/all', EventController.getAllEvents);
router.get('/count', EventController.getEventCount);
router.get('/connections', EventController.eventConnectionList);
router.get('/:id', EventController.getEventById);
router.put('/:id', EventController.updateEvent);
router.delete('/:id', EventController.deleteEvent);
router.put('/toggle/:id', EventController.toggleEventRegistration);
router.get('/attendees/:event_id', EventController.getEventAttendees);
router.get('/analytics/:event_id', EventController.getEventAnalytics);

module.exports = router;
