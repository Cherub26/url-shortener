import { Pool } from 'pg';
import dotenv from 'dotenv';
import { nanoid } from '../utils/nanoid';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(20) UNIQUE NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      hashed_password VARCHAR(255) NOT NULL
    );
  `;
  const createUrlsTableQuery = `
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(12) UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      click_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  try {
    await pool.query(createUsersTableQuery);
    await pool.query(createUrlsTableQuery);
  } catch (err) {
    console.error("Error ensuring tables exist:", err);
  }
})();

export default pool; 