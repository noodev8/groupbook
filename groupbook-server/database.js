/*
=======================================================================================================================================
Database Connection Pool
=======================================================================================================================================
Purpose: Creates and exports a PostgreSQL connection pool for use throughout the application.
         All database queries should use the exported query function.
Usage: const { query } = require('./database');
       const result = await query('SELECT * FROM app_user WHERE id = $1', [userId]);
=======================================================================================================================================
*/

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool using the DATABASE_URL from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log successful connection (only in development)
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    // console.log('Database connected successfully');
  }
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Export a query function that uses the pool
// This allows us to run queries without managing connections manually
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
