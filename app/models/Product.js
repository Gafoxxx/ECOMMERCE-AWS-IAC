const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  description: { 
    type: DataTypes.TEXT 
  },
  price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  }
  ,
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  }
  ,
  image: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Product;