const express = require('express');
const router = express.Router();
const EventController = require('../../controllers/Admin/eventController');
const adminAuth = require('../../middleware/adminAuth');

router.post('/create',   EventController.createEvent);
router.get('/all',   EventController.getAllEvents);
router.get('/count',  EventController.getEventCount);
router.get('/:id',  EventController.getEventById);
router.put('/:id',adminAuth.verifyToken,  EventController.updateEvent);
router.delete('/:id',adminAuth.verifyToken,  EventController.deleteEvent);
router.put('/toggle/:id',adminAuth.verifyToken,  EventController.toggleEventRegistration);
router.get('/attendees/:event_id',adminAuth.verifyToken,  EventController.getEventAttendees);
router.get('/analytics/:event_id',adminAuth.verifyToken,  EventController.getEventAnalytics);
router.post('/deletemass',adminAuth.verifyToken,  EventController.deleteMassEvents);
router.get('/connections/:eventId',adminAuth.verifyToken, EventController.getUsersWithConnectionsInEvent);


router.get('/eventlist/:time_range',adminAuth.verifyToken, EventController.getEventsByTimeRange);

router.get('/total/connections',adminAuth.verifyToken, EventController.eventConnectionList);

module.exports = router;
