const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ where: { UserId: req.user.id } });
    if (!cart) {
      cart = await Cart.create({ UserId: req.user.id });
      return res.json({ items: [] });
    }
    const items = await CartItem.findAll({ where: { CartId: cart.id }, include: [Product] });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
});

router.post('/add', auth, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    let cart = await Cart.findOne({ where: { UserId: req.user.id } });
    if (!cart) cart = await Cart.create({ UserId: req.user.id });
    let item = await CartItem.findOne({ where: { CartId: cart.id, ProductId: productId } });
    if (item) {
      item.quantity = item.quantity + (quantity || 1);
      await item.save();
    } else {
      item = await CartItem.create({ CartId: cart.id, ProductId: productId, quantity });
    }
    const updated = await CartItem.findAll({ where: { CartId: cart.id }, include: [Product] });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al añadir al carrito' });
  }
});

router.post('/remove', auth, async (req, res) => {
  const { productId } = req.body;
  try {
    const cart = await Cart.findOne({ where: { UserId: req.user.id } });
    if (!cart) return res.status(400).json({ error: 'Carrito vacío' });
    const item = await CartItem.findOne({ where: { CartId: cart.id, ProductId: productId } });
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });
    await item.destroy();
    const updated = await CartItem.findAll({ where: { CartId: cart.id }, include: [Product] });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al remover item' });
  }
});

module.exports = router;
