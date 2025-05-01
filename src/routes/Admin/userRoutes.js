const express = require('express');
const router = express.Router();
const userController = require('../../controllers/Admin/userController');

// /users
router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/count', userController.getUserCount);
router.get('/block-status', userController.getAllUsersblcokedStatus);
router.put('/block-status', userController.setUserBlockStatus);
router.post('/', userController.createUser);
router.get('/connections/:userId', userController.getUserConnectionsInAttendedEvents);
router.get('/:userId/:eventId/connections', userController.getUserEventConnections);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/attended-events/:userId', userController.getAttendedEventsByUser);

module.exports = router;
