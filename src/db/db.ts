import { Pool } from 'pg';
import dotenv from 'dotenv';
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
      password VARCHAR(255) NOT NULL
    );
  `;
  const createUrlsTableQuery = `
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      short_id VARCHAR(12) UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      click_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
      expires_at TIMESTAMPTZ DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  const createClickStatsTableQuery = `
    CREATE TABLE IF NOT EXISTS click_stats (
      id SERIAL PRIMARY KEY,
      url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
      timestamp TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
      ip VARCHAR(45),
      country VARCHAR(64),
      city VARCHAR(64),
      browser VARCHAR(64),
      os VARCHAR(64),
      device VARCHAR(64),
      user_agent TEXT
    );
  `;

  // Index creation queries for better performance
  const createIndexesQuery = `
    CREATE INDEX IF NOT EXISTS idx_urls_short_id ON urls(short_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
    CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
    CREATE INDEX IF NOT EXISTS idx_click_stats_url_id ON click_stats(url_id);
  `;

  try {
    await pool.query(createUsersTableQuery);
    await pool.query(createUrlsTableQuery);
    await pool.query(createClickStatsTableQuery);
    await pool.query(createIndexesQuery);
    console.log('Database tables and indexes created successfully');
  } catch (err) {
    console.error("Error ensuring tables and indexes exist:", err);
  }
})();

export default pool; 