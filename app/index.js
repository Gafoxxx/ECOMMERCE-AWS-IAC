const express = require('express');
const sequelize = require('./config/db');
const Product = require('./models/Product');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ruta básica para probar el Catálogo de Productos [cite: 8, 20]
app.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Sincronizar Base de Datos y Arrancar Servidor [cite: 21]
sequelize.sync({ force: false }) // Crea las tablas si no existen
  .then(() => {
    console.log('✅ Conexión a RDS exitosa y tablas sincronizadas.');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });