const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cart = sequelize.define('Cart', {
  // Cart simple container; associations store owner
});

module.exports = Cart;
