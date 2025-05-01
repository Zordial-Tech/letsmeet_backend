// const { Sequelize } = require('sequelize');
// require('dotenv').config(); // Load environment variables

// // Create Sequelize instance
// const sequelize = new Sequelize(
//   process.env.DB_NAME,     // Database Name
//   process.env.DB_USER,     // Database User
//   process.env.DB_PASSWORD, // Database Password
//   {
//     host: process.env.DB_HOST, // Database Host
//     dialect: 'postgres',       // Using PostgreSQL
//     port: process.env.DB_PORT || 5432, // Default PostgreSQL Port
//     logging: false, // Disable logging (optional)
//   }
// );

// // Test database connection
// sequelize
//   .authenticate()
//   .then(() => console.log('✅ Database connected successfully...'))
//   .catch(err => console.error('❌ Database connection error:', err.message));

// module.exports = sequelize;

const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables

// Create Sequelize instance using DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Disable SQL query logging
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for some hosted platforms like Neon
    },
  },
});

// Test database connection
sequelize
  .authenticate()
  .then(() => console.log('✅ Database connected successfully...'))
  .catch(err => console.error('❌ Database connection error:', err.message));

module.exports = sequelize;
