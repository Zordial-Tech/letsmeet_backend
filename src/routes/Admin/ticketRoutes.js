const express = require('express');
const { bookTicket, cancelTicket, getUserTickets } = require('../../controllers/Admin/ticketController.js');
const { verifyToken } = require('../../middleware/auth.js');

const router = express.Router();

router.post('/book', verifyToken, bookTicket);
router.delete('/cancel/:ticketId', verifyToken, cancelTicket);
router.get('/my-tickets', verifyToken, getUserTickets);

module.exports = router;
