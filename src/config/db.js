// const { Sequelize } = require('sequelize');
// require('dotenv').config(); 

// const sequelize = new Sequelize(
//   process.env.DB_NAME,  
//   process.env.DB_USER,    
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: 'postgres',   
//     port: process.env.DB_PORT || 5432, 
//     logging: false, 
//   }
// );

// sequelize
//   .authenticate()
//   .then(() => console.log('Database connected successfully...'))
//   .catch(err => console.error('Database connection error:', err.message));

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
  .then(() => console.log('Database connected successfully...'))
  .catch(err => console.error('❌ Database connection error:', err.message));

module.exports = sequelize;
