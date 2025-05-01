const User = require('./User');
const Event = require('./Event');
const Venue = require('./Venue');
const Booking = require('./Booking');
const Payment = require('./Payment');
const Ticket = require('./Ticket');

// Relationships
User.hasMany(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });

Event.belongsTo(Venue, { foreignKey: 'venueId' });
Venue.hasMany(Event, { foreignKey: 'venueId' });

Event.hasMany(Booking, { foreignKey: 'eventId' });
Booking.belongsTo(Event, { foreignKey: 'eventId' });

Booking.hasMany(Ticket, { foreignKey: 'bookingId' });
Ticket.belongsTo(Booking, { foreignKey: 'bookingId' });

Booking.hasOne(Payment, { foreignKey: 'bookingId' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId' });

module.exports = { User, Event, Venue, Booking, Payment, Ticket };
