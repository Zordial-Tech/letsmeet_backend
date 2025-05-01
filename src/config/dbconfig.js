// const { Pool } = require('pg');

// const pool = new Pool({
//     user: 'letsmeet_admin',
//     host: 'localhost',
//     database: 'lets_meet',
//     password: 'lets123',
//     port: 5432,
// });

// module.exports = pool;

const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for some services like Neon
  },
});

module.exports = pool;
