const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

function clean(value) {
  return String(value || '').trim();
}

router.post('/', auth, async (req, res) => {
  try {
    const shipping = {
      shippingName: clean(req.body.shippingName),
      shippingEmail: clean(req.body.shippingEmail),
      shippingPhone: clean(req.body.shippingPhone),
      shippingAddress: clean(req.body.shippingAddress),
      shippingCity: clean(req.body.shippingCity),
      shippingNotes: clean(req.body.shippingNotes)
    };
    const required = ['shippingName', 'shippingEmail', 'shippingPhone', 'shippingAddress', 'shippingCity'];
    const missing = required.filter(field => !shipping[field]);
    if (missing.length) {
      return res.status(400).json({ error: 'Completa los datos de envio' });
    }

    const cart = await Cart.findOne({ where: { UserId: req.user.id } });
    if (!cart) return res.status(400).json({ error: 'Carrito vacío' });
    const items = await CartItem.findAll({ where: { CartId: cart.id }, include: [Product] });
    if (!items.length) return res.status(400).json({ error: 'Carrito vacío' });

    let total = 0;
    const orderItems = [];
    for (const it of items) {
      const quantity = Number(it.quantity || 0);
      const unitPrice = Number(it.Product.price || 0);
      const subtotal = quantity * unitPrice;
      total += subtotal;
      orderItems.push({
        ProductId: it.Product.id,
        productName: it.Product.name,
        productImage: it.Product.image,
        unitPrice,
        quantity,
        subtotal
      });
    }

    const paymentReference = `SIM-${Date.now()}`;
    const order = await Order.create({
      total,
      status: 'paid',
      paymentReference,
      UserId: req.user.id,
      ...shipping
    });
    const createdItems = await Promise.all(
      orderItems.map(item => OrderItem.create({ ...item, OrderId: order.id }))
    );

    // Reducir stock y vaciar carrito
    for (const it of items) {
      const product = it.Product;
      if (product.stock !== undefined && product.stock !== null) {
        product.stock = Math.max(0, (product.stock - it.quantity));
        await product.save();
      }
      await it.destroy();
    }

    res.json({
      message: 'Pedido confirmado con pago simulado',
      order: {
        ...order.toJSON(),
        items: createdItems.map(item => item.toJSON())
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en checkout' });
  }
});

module.exports = router;
