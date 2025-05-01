const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.UUID,
    references: { model: 'Bookings', key: 'id' },
  },
  seatNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('VIP', 'Regular', 'Student'),
    allowNull: false,
  },
}, { timestamps: true });

module.exports = Ticket;
