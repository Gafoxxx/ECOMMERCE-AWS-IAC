const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const Order = require('../models/Order');

router.post('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { UserId: req.user.id } });
    if (!cart) return res.status(400).json({ error: 'Carrito vacío' });
    const items = await CartItem.findAll({ where: { CartId: cart.id }, include: [Product] });
    if (!items.length) return res.status(400).json({ error: 'Carrito vacío' });

    let total = 0;
    for (const it of items) {
      total += parseFloat(it.quantity) * parseFloat(it.Product.price);
    }

    const paymentReference = `SIM-${Date.now()}`;
    const order = await Order.create({ total, status: 'paid', paymentReference, UserId: req.user.id });

    // Reducir stock y vaciar carrito
    for (const it of items) {
      const product = it.Product;
      if (product.stock !== undefined && product.stock !== null) {
        product.stock = Math.max(0, (product.stock - it.quantity));
        await product.save();
      }
      await it.destroy();
    }

    res.json({ message: 'Pago simulado exitoso', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en checkout' });
  }
});

module.exports = router;
