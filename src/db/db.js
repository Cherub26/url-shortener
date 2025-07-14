const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ensure the 'urls' table exists
(async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(10) UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      click_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
  } catch (err) {
    console.error("Error ensuring 'urls' table exists:", err);
  }
})();

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', res.rows[0].now);
  } catch (err) {
    console.error('PostgreSQL connection error:', err);
  }
}

testConnection();

module.exports = pool; 