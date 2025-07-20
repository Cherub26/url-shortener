import { customAlphabet } from 'nanoid';
import pool from '../db/db';

export const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

// Generate a unique user_id with collision handling
export const generateUniqueUserId = async (maxRetries: number = 5): Promise<string> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const userId = nanoid();
    
    try {
      // Check if user_id already exists
      const result = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
      if (result.rows.length === 0) {
        return userId;
      }
      console.log(`user_id collision detected on attempt ${attempt + 1}, retrying...`);
    } catch (err) {
      console.error('Error checking user_id uniqueness:', err);
      // Continue to next attempt
    }
  }
  
  throw new Error('Failed to generate unique user_id after maximum retries');
};

// Generate a unique short_id with collision handling
export const generateUniqueShortId = async (maxRetries: number = 5): Promise<string> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const shortId = nanoid();
    
    try {
      // Check if short_id already exists
      const result = await pool.query('SELECT short_id FROM urls WHERE short_id = $1', [shortId]);
      if (result.rows.length === 0) {
        return shortId;
      }
      console.log(`short_id collision detected on attempt ${attempt + 1}, retrying...`);
    } catch (err) {
      console.error('Error checking short_id uniqueness:', err);
      // Continue to next attempt
    }
  }
  
  throw new Error('Failed to generate unique short_id after maximum retries');
}; 