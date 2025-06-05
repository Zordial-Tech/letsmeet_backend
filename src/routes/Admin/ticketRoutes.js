const express = require('express');
const { bookTicket, cancelTicket, getUserTickets } = require('../../controllers/Admin/ticketController.js');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.post('/book',adminAuth.verifyToken, bookTicket);
router.delete('/cancel/:ticketId',adminAuth.verifyToken, cancelTicket);
router.get('/my-tickets',adminAuth.verifyToken, getUserTickets);

module.exports = router;
