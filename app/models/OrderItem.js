const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
  productName: { type: DataTypes.STRING, allowNull: false },
  productImage: { type: DataTypes.STRING },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
});

module.exports = OrderItem;
