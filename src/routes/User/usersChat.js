const express = require('express');
const router = express.Router();
const userChatController = require('../../controllers/User/userChatController');
const userAuth = require('../../middleware/userAuth');




router.get('/chat-connections', userAuth, userChatController.getApprovedConnectionsWithLastMessage);
router.get('/with/:peer_id', userAuth, userChatController.getChatWithUser);
router.post('/send/:peer_id', userAuth, userChatController.sendMessageToUser);
router.delete('/delete/:peer_id', userAuth, userChatController.deleteChat);


module.exports = router;