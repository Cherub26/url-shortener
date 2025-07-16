import { Request, Response } from 'express';
import pool from '../db/db';
import { nanoid } from '../utils/nanoid';

// Helper function to increment click count
async function incrementClickCount(shortId: string) {
  await pool.query('UPDATE urls SET click_count = click_count + 1 WHERE short_id = $1', [shortId]);
}

// Shorten a long URL
export const shortenUrl = async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  const shortId = nanoid();
  try {
    // If user is authenticated, associate user_id
    const userId = (req as any).user?.user_id || null;
    if (userId) {
      await pool.query(
        'INSERT INTO urls (short_id, original_url, click_count, user_id) VALUES ($1, $2, $3, $4)',
        [shortId, url, 0, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO urls (short_id, original_url, click_count) VALUES ($1, $2, $3)',
        [shortId, url, 0]
      );
    }
    const shortUrl = `${req.protocol}://${req.get('host')}/${shortId}`;
    res.json({ shortUrl });
  } catch (err) {
    console.error('Error saving URL:', err);
    res.status(500).json({ message: 'Failed to shorten URL' });
  }
};

// Redirect to the original URL
export const redirectUrl = async (req: Request, res: Response) => {
  const { shortId } = req.params;
  try {
    // Look up original URL in database by shortId
    const result = await pool.query('SELECT original_url FROM urls WHERE short_id = $1', [shortId]);
    if (result.rows.length) {
      await incrementClickCount(shortId);
      // Redirect to the original URL
      return res.redirect(result.rows[0].original_url);
    } else {
      return res.status(404).send('URL not found');
    }
  } catch (err) {
    console.error('Error during redirect:', err);
    res.status(500).send('Server error');
  }
}; 