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
      const samples = [
        { name: 'Audífonos Bluetooth Pro', description: 'Audífonos inalámbricos con cancelación de ruido y estuche de carga para uso diario.', price: 189900, stock: 50, image: '/assets/images/audifonos.jpg' },
        { name: 'Reloj Inteligente Fit', description: 'Smartwatch con monitor de actividad, frecuencia cardíaca y notificaciones del celular.', price: 329900, stock: 30, image: '/assets/images/reloj.jpg' },
        { name: 'Mochila Ejecutiva Impermeable', description: 'Mochila resistente al agua con compartimento para portátil y organizadores internos.', price: 149900, stock: 80, image: '/assets/images/mochila.jpg' },
        { name: 'Lámpara LED de Escritorio', description: 'Lámpara regulable con luz cálida y fría, ideal para estudio, trabajo remoto y lectura.', price: 89900, stock: 120, image: '/assets/images/lampara.jpg' },
        { name: 'Parlante Bluetooth Portátil', description: 'Parlante compacto con batería de larga duración y sonido potente para interiores y exteriores.', price: 159900, stock: 40, image: '/assets/images/altavoz.jpg' },
        { name: 'Cargador Rápido USB-C 30W', description: 'Cargador compacto compatible con celulares, tablets y accesorios USB-C.', price: 69900, stock: 200, image: '/assets/images/cargador.jpg' }
      ];

      const existingProducts = await Product.findAll({ order: [['id', 'ASC']], limit: samples.length });
      for (const [index, product] of samples.entries()) {
        const existing = existingProducts[index];
        if (existing) {
          await existing.update(product);
        } else {
          await Product.create(product);
        }
      }
      console.log('⚡️ Productos de ejemplo sincronizados en la base de datos.');
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
