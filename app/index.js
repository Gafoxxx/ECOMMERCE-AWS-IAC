require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const CartItem = require('./models/CartItem');
const Order = require('./models/Order');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const uploadRoutes = require('./routes/upload');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Servir index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Asociaciones (sencillas)
User.hasOne(Cart);
Cart.belongsTo(User);

Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✅ Conexión a DB exitosa y tablas sincronizadas.');
    try {
      const count = await Product.count();
      if (!count) {
        const samples = [
          { name: 'Auriculares Wireless', description: 'Auriculares inalámbricos con cancelación de ruido.', price: 59.99, stock: 50, image: '/assets/images/product-1.svg' },
          { name: 'Reloj Inteligente', description: 'Smartwatch con monitor de actividad y notificaciones.', price: 129.90, stock: 30, image: '/assets/images/product-2.svg' },
          { name: 'Mochila Urbana', description: 'Mochila resistente al agua para uso diario.', price: 39.50, stock: 80, image: '/assets/images/product-3.svg' },
          { name: 'Lámpara LED', description: 'Lámpara de escritorio con brillo regulable.', price: 24.99, stock: 120, image: '/assets/images/product-4.svg' },
          { name: 'Altavoz Bluetooth', description: 'Altavoz portátil con gran autonomía.', price: 45.00, stock: 40, image: '/assets/images/product-5.svg' },
          { name: 'Cargador USB-C', description: 'Cargador rápido compatible con la mayoría de dispositivos.', price: 19.99, stock: 200, image: '/assets/images/product-6.svg' }
        ];
        await Product.bulkCreate(samples, { validate: true });
        console.log('⚡️ Productos de ejemplo creados en la base de datos.');
      }
    } catch (err) {
      console.error('❌ Error al crear productos de ejemplo:', err);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });