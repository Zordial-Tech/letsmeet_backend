const express = require('express');

const connectionController = require('../../controllers/Admin/connectionController');

const router = express.Router();


router.get('/all', connectionController.getAllConnections);
router.get('/ranking', connectionController.getUserConnectionsRanking);
router.get('/count', connectionController.getConnectionCount);
// router.post('/send-request', verifyToken, sendConnectionRequest);
// router.put('/accept/:requestId', verifyToken, acceptConnection);


module.exports = router;
