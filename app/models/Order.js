const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  total: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'paid' },
  paymentReference: { type: DataTypes.STRING },
  externalReference: { type: DataTypes.STRING },
  preferenceId: { type: DataTypes.STRING },
  paymentId: { type: DataTypes.STRING },
  paymentStatusDetail: { type: DataTypes.STRING },
  shippingName: { type: DataTypes.STRING },
  shippingEmail: { type: DataTypes.STRING },
  shippingPhone: { type: DataTypes.STRING },
  shippingAddress: { type: DataTypes.STRING },
  shippingCity: { type: DataTypes.STRING },
  shippingNotes: { type: DataTypes.TEXT }
});

module.exports = Order;
