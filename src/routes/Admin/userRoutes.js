const express = require('express');
const router = express.Router();
const userController = require('../../controllers/Admin/userController');
const adminAuth = require('../../middleware/adminAuth');

// /users
router.get('/',adminAuth.verifyToken, userController.getAllUsers);
router.get('/stats', adminAuth.verifyToken, userController.getUserStats);
router.get('/count',adminAuth.verifyToken,  userController.getUserCount);
router.get('/block-status',adminAuth.verifyToken,  userController.getAllUsersblcokedStatus);
router.put('/block-status',adminAuth.verifyToken,  userController.setUserBlockStatus);
router.post('/',adminAuth.verifyToken,  userController.createUser);
router.get('/connections/:userId',adminAuth.verifyToken,  userController.getUserConnectionsInAttendedEvents);
router.get('/:userId/:eventId/connections',adminAuth.verifyToken,  userController.getUserEventConnections);
router.get('/:id',adminAuth.verifyToken,  userController.getUserById);
router.put('/:id',adminAuth.verifyToken,  userController.updateUser);
router.delete('/:id',adminAuth.verifyToken,  userController.deleteUser);
router.get('/attended-events/:userId',adminAuth.verifyToken,  userController.getAttendedEventsByUser);
router.post('/deletemass', userController.deleteUsers);
router.put('/status/:id',adminAuth.verifyToken,  userController.updateUserStatus);

// /users/attendee-roles
router.get('/attendee/roles',  userController.getAllAttendeeRoles);
router.post('/attendee/roles',  userController.addAttendeeRole);
router.put('/attendee/roles/:id',  userController.editAttendeeRole);
router.delete('/attendee/roles/:id',  userController.deleteAttendeeRole);




module.exports = router;
