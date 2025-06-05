const express = require('express');
const router = express.Router();
const userConnectionsController = require('../../controllers/User/userConnnectionController');
const userAuth = require('../../middleware/userAuth');

router.post('/send-request', userAuth, userConnectionsController.sendConnectionRequest);
router.put('/respond/:userId', userAuth, userConnectionsController.respondToConnectionRequest);
router.get('/pending-requests', userAuth, userConnectionsController.getPendingConnectionRequests);

module.exports = router;