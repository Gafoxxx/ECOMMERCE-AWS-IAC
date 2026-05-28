const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const MP_API = 'https://api.mercadopago.com';

function clean(value) {
  return String(value || '').trim();
}

function appBaseUrl() {
  return (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function accessToken() {
  return clean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function paymentDebugEnabled() {
  return ['1', 'true', 'yes'].includes(clean(process.env.PAYMENT_DEBUG_ERRORS).toLowerCase());
}

function safeErrorDetail(detail) {
  if (!detail || typeof detail !== 'object') return detail || 'Error sin detalle';
  return JSON.parse(JSON.stringify(detail, (key, value) => {
    if (/token|authorization|secret|password/i.test(key)) return '[redacted]';
    return value;
  }));
}

function requireMercadoPagoConfig(res) {
  if (!accessToken()) {
    res.status(500).json({ error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN' });
    return false;
  }
  return true;
}

async function mercadoPagoRequest(path, options = {}) {
  const response = await fetch(`${MP_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || data.error || 'Error de Mercado Pago';
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

function shippingFromBody(body) {
  return {
    shippingName: clean(body.shippingName),
    shippingEmail: clean(body.shippingEmail),
    shippingPhone: clean(body.shippingPhone),
    shippingAddress: clean(body.shippingAddress),
    shippingCity: clean(body.shippingCity),
    shippingNotes: clean(body.shippingNotes)
  };
}

function validateShipping(shipping) {
  const required = ['shippingName', 'shippingEmail', 'shippingPhone', 'shippingAddress', 'shippingCity'];
  return required.filter(field => !shipping[field]);
}

async function getCartItems(userId) {
  const cart = await Cart.findOne({ where: { UserId: userId } });
  if (!cart) return { cart: null, items: [] };
  const items = await CartItem.findAll({ where: { CartId: cart.id }, include: [Product] });
  return { cart, items };
}

function buildOrderItems(items) {
  let total = 0;
  const orderItems = items.map(item => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.Product.price || 0);
    const subtotal = quantity * unitPrice;
    total += subtotal;
    return {
      ProductId: item.Product.id,
      productName: item.Product.name,
      productImage: item.Product.image,
      unitPrice,
      quantity,
      subtotal
    };
  });
  return { total, orderItems };
}

function preferencePayload(order, orderItems, shipping) {
  const baseUrl = appBaseUrl();
  const notificationUrl = clean(process.env.MERCADOPAGO_WEBHOOK_URL);
  const payload = {
    items: orderItems.map(item => ({
      id: String(item.ProductId),
      title: item.productName,
      picture_url: item.productImage ? `${baseUrl}${item.productImage}` : undefined,
      quantity: item.quantity,
      currency_id: 'COP',
      unit_price: Number(item.unitPrice)
    })),
    payer: {
      name: shipping.shippingName,
      email: shipping.shippingEmail,
      phone: { number: shipping.shippingPhone },
      address: { street_name: shipping.shippingAddress }
    },
    back_urls: {
      success: `${baseUrl}/payment/success`,
      failure: `${baseUrl}/payment/failure`,
      pending: `${baseUrl}/payment/pending`
    },
    external_reference: order.externalReference,
    statement_descriptor: 'ECOMMERCE',
    metadata: {
      order_id: order.id,
      user_id: order.UserId,
      shipping_city: shipping.shippingCity
    }
  };

  if (notificationUrl) {
    payload.notification_url = notificationUrl;
  }

  if (baseUrl.startsWith('https://')) {
    payload.auto_return = 'approved';
  }

  return payload;
}

async function finalizeApprovedOrder(order, payment) {
  if (order.status === 'paid') {
    await order.update({
      paymentId: String(payment.id || order.paymentId || ''),
      paymentStatusDetail: payment.status_detail || order.paymentStatusDetail
    });
    return order;
  }

  const cart = await Cart.findOne({ where: { UserId: order.UserId } });
  const orderItems = await OrderItem.findAll({ where: { OrderId: order.id }, include: [Product] });

  for (const item of orderItems) {
    if (item.Product && item.Product.stock !== undefined && item.Product.stock !== null) {
      item.Product.stock = Math.max(0, Number(item.Product.stock) - Number(item.quantity || 0));
      await item.Product.save();
    }
  }

  if (cart) {
    await CartItem.destroy({ where: { CartId: cart.id } });
  }

  await order.update({
    status: 'paid',
    paymentId: String(payment.id || order.paymentId || ''),
    paymentStatusDetail: payment.status_detail || order.paymentStatusDetail
  });

  return order;
}

async function updateOrderFromPayment(order, payment) {
  const statusMap = {
    approved: 'paid',
    rejected: 'failed',
    cancelled: 'failed',
    refunded: 'refunded',
    charged_back: 'failed',
    in_process: 'pending',
    pending: 'pending'
  };
  const nextStatus = statusMap[payment.status] || 'pending';

  if (nextStatus === 'paid') {
    return finalizeApprovedOrder(order, payment);
  }

  await order.update({
    status: nextStatus,
    paymentId: String(payment.id || ''),
    paymentStatusDetail: payment.status_detail || ''
  });

  return order;
}

async function orderWithItems(order) {
  const items = await OrderItem.findAll({ where: { OrderId: order.id } });
  return {
    ...order.toJSON(),
    items: items.map(item => item.toJSON())
  };
}

router.post('/create-preference', auth, async (req, res) => {
  try {
    if (!requireMercadoPagoConfig(res)) return;

    const shipping = shippingFromBody(req.body);
    if (validateShipping(shipping).length) {
      return res.status(400).json({ error: 'Completa los datos de envio' });
    }

    const { items } = await getCartItems(req.user.id);
    if (!items.length) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    const { total, orderItems } = buildOrderItems(items);
    const order = await Order.create({
      total,
      status: 'pending',
      paymentReference: `MP-${Date.now()}`,
      UserId: req.user.id,
      ...shipping
    });
    const externalReference = `ORDER-${order.id}-${Date.now()}`;
    await order.update({ externalReference });

    await Promise.all(orderItems.map(item => OrderItem.create({ ...item, OrderId: order.id })));

    const preference = await mercadoPagoRequest('/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify(preferencePayload(order, orderItems, shipping))
    });

    await order.update({ preferenceId: preference.id });

    res.json({
      orderId: order.id,
      preferenceId: preference.id,
      initPoint: preference.sandbox_init_point || preference.init_point,
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || null
    });
  } catch (err) {
    console.error('Mercado Pago create preference error:', err.details || err);
    const payload = { error: 'No fue posible iniciar el pago con Mercado Pago' };
    if (paymentDebugEnabled()) {
      payload.detail = safeErrorDetail(err.details || err.message || err);
    }
    res.status(err.status || 500).json(payload);
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    if (!requireMercadoPagoConfig(res)) return;

    const paymentId = clean(req.query.payment_id || req.query.collection_id);
    const externalReference = clean(req.query.external_reference);
    let order = null;

    if (externalReference) {
      order = await Order.findOne({ where: { externalReference, UserId: req.user.id } });
    }
    if (!order && req.query.order_id) {
      order = await Order.findOne({ where: { id: req.query.order_id, UserId: req.user.id } });
    }
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (paymentId) {
      const payment = await mercadoPagoRequest(`/v1/payments/${paymentId}`);
      order = await updateOrderFromPayment(order, payment);
    }

    res.json({ order: await orderWithItems(order) });
  } catch (err) {
    console.error('Mercado Pago status error:', err.details || err);
    res.status(err.status || 500).json({ error: 'No fue posible consultar el estado del pago' });
  }
});

router.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    if (!accessToken()) return;

    const topic = clean(req.query.topic || req.body.type || req.body.topic);
    const paymentId = clean(req.query.id || (req.body.data && req.body.data.id));
    if (topic !== 'payment' || !paymentId) return;

    const payment = await mercadoPagoRequest(`/v1/payments/${paymentId}`);
    const externalReference = clean(payment.external_reference);
    if (!externalReference) return;

    let order = await Order.findOne({ where: { externalReference } });
    if (!order && payment.metadata && payment.metadata.order_id) {
      order = await Order.findByPk(payment.metadata.order_id);
    }
    if (!order) return;

    await updateOrderFromPayment(order, payment);
  } catch (err) {
    console.error('Mercado Pago webhook error:', err.details || err);
  }
});

module.exports = router;
