const express = require('express');

const connectionController = require('../../controllers/Admin/connectionController');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();


router.get('/all',adminAuth.verifyToken,  connectionController.getAllConnections);
router.get('/ranking',adminAuth.verifyToken,  connectionController.getUserConnectionsRanking);
router.get('/count',adminAuth.verifyToken,  connectionController.getConnectionCount);
// router.post('/send-request', verifyToken, sendConnectionRequest);
// router.put('/accept/:requestId', verifyToken, acceptConnection);


module.exports = router;
