const Ticket = require('../../models/Ticket');

exports.bookTicket = async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error booking ticket', error });
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await ticket.destroy();
    res.json({ message: 'Ticket canceled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error canceling ticket', error });
  }
};

exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({ where: { userId: req.user.id } });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error });
  }
};
