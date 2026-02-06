// Import required classes from the pg module
const { Pool, Client } = require('pg');

// Create a new client instance using environment variables
// Note: We use the destructured 'Client' here instead of 'pg.Client'
const db = new Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Connect to the database
db.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Connection error', err.stack));

// Initialize a pool for the query function to use
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

/**
 * Helper function to execute queries using the connection pool
 * @param {string} sql - The SQL query string
 * @param {Array} params - Array of parameters for the query
 * @returns {Promise<Array>} - The result rows
 */
async function query(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

module.exports = {
  db,
  query
};