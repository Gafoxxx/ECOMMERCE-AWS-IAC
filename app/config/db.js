require('dotenv').config(); // Línea 1 obligatoria
const { Sequelize } = require('sequelize');

let sequelize;

const forceSqlite = (String(process.env.DB_FORCE_SQLITE || '').toLowerCase() === 'true' || process.env.DB_FORCE_SQLITE === '1');

const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS;

// Si se proporcionan credenciales de RDS/MySQL y no se fuerza SQLite, las usamos; si no, usamos SQLite local para pruebas
if (!forceSqlite && process.env.DB_NAME && process.env.DB_USER && dbPassword && process.env.DB_HOST) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    dbPassword,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false
    }
  );
} else {
  if (forceSqlite) console.log('ℹ️ DB_FORCE_SQLITE is set — using local SQLite database for development/testing');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './dev-database.sqlite',
    logging: false
  });
}

module.exports = sequelize;
