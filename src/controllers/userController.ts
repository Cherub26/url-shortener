import { Request, Response } from 'express';
import pool from '../db/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateUniqueUserId } from '../utils/nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const randomUserId = await generateUniqueUserId();
    
    const result = await pool.query(
      'INSERT INTO users (user_id, username, hashed_password) VALUES ($1, $2, $3) RETURNING id, user_id, username',
      [randomUserId, username, hashedPassword]
    );
    const user = result.rows[0];
    res.status(201).json({ id: user.id, user_id: user.user_id, username: user.username });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, user_id: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getUserLinks = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await pool.query(
      'SELECT short_id, original_url, click_count FROM urls WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );
    const links = result.rows.map((row: any) => ({
      shortUrl: `${req.protocol}://${req.get('host')}/${row.short_id}`,
      longUrl: row.original_url,
      clickCount: row.click_count
    }));
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
}; 