import { Request, Response } from 'express';
import path from 'path';
import pool from '../db/db';
import { generateUniqueShortId } from '../utils/nanoid';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';
import redis from '../utils/redis';
import { clickStatsQueue } from '../utils/queue';

async function aggregateClickStats(urlId: number) {
  const statsResult = await pool.query(`
    SELECT 
      country,
      browser,
      os,
      device,
      COUNT(*) as count
    FROM click_stats 
    WHERE url_id = $1
    GROUP BY country, browser, os, device
    ORDER BY count DESC
  `, [urlId]);

  const byCountry = new Map();
  const byBrowser = new Map();
  const byOs = new Map();
  const byDevice = new Map();

  statsResult.rows.forEach(row => {
    // Handle null values by using 'Unknown' as the default
    const country = row.country || 'Unknown';
    const browser = row.browser || 'Unknown';
    const os = row.os || 'Unknown';
    const device = row.device || 'Unknown';
    
    byCountry.set(country, (byCountry.get(country) || 0) + parseInt(row.count));
    byBrowser.set(browser, (byBrowser.get(browser) || 0) + parseInt(row.count));
    byOs.set(os, (byOs.get(os) || 0) + parseInt(row.count));
    byDevice.set(device, (byDevice.get(device) || 0) + parseInt(row.count));
  });

  // Convert maps to sorted arrays
  const byCountryArray = Array.from(byCountry.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
  
  const byBrowserArray = Array.from(byBrowser.entries())
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count);
  
  const byOsArray = Array.from(byOs.entries())
    .map(([os, count]) => ({ os, count }))
    .sort((a, b) => b.count - a.count);
  
  const byDeviceArray = Array.from(byDevice.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  return {
    byCountry: byCountryArray,
    byBrowser: byBrowserArray,
    byOs: byOsArray,
    byDevice: byDeviceArray
  };
}

// Helper function to collect click stats
async function collectClickStats(urlId: number, shortId: string, req: Request) {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || null;
  const geo = ip ? geoip.lookup(ip) : null;
  const country = geo?.country || null;
  const city = geo?.city || null;
  const userAgent = req.headers['user-agent'] || '';
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser().name || null;
  const os = parser.getOS().name || null;
  const device = parser.getDevice().type || 'desktop';
  
  await clickStatsQueue.add('log-click', {
    urlId,
    shortId,
    ip,
    country,
    city,
    browser,
    os,
    device,
    userAgent
  });
}

// Shorten a long URL
export const shortenUrl = async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  try {
    const shortId = await generateUniqueShortId();
    
    // If user is authenticated, associate user_id
    const userId = (req as any).user?.id || null;
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
    // Try to get original_url and url_id from Redis cache first
    const cacheKey = `shorturl:${shortId}`;
    const cachedData = await redis.get(cacheKey);
    let originalUrl: string | null = null;
    let urlId: number | null = null;
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        originalUrl = parsed.original_url;
        urlId = parsed.url_id;
      } catch (e) {}
    }
    if (originalUrl && urlId) {
      res.redirect(originalUrl as string);
      // Collect click stats asynchronously
      await collectClickStats(urlId!, shortId, req);
      return;
    }
    // Not in cache, look up original URL and id in database by shortId
    const result = await pool.query('SELECT id, original_url FROM urls WHERE short_id = $1', [shortId]);
    if (result.rows.length) {
      urlId = result.rows[0].id;
      originalUrl = result.rows[0].original_url;
      res.redirect(originalUrl as string);
      
      // Collect click stats asynchronously
      await collectClickStats(urlId!, shortId, req);
      
      // Cache both original_url and url_id in Redis for 10 minutes
      await redis.set(cacheKey, JSON.stringify({ original_url: originalUrl, url_id: urlId }), 'EX', 600);
      return;
    } else {
      // If short URL not found, serve index.html so frontend router can handle 404
      return res.sendFile(path.join(__dirname, '../../public/index.html'));
    }
  } catch (err) {
    console.error('Error during redirect:', err);
    res.status(500).send('Server error');
  }
}; 

// Get all click stats for a shortId
export const getClickStatsForShortId = async (req: Request, res: Response) => {
  const { shortId } = req.params;
  try {
    // Get url_id from shortId
    const urlResult = await pool.query('SELECT id FROM urls WHERE short_id = $1', [shortId]);
    if (!urlResult.rows.length) {
      return res.status(404).json({ message: 'Short URL not found' });
    }
    const urlId = urlResult.rows[0].id;
    // Get all click stats for this url_id
    const statsResult = await pool.query('SELECT * FROM click_stats WHERE url_id = $1 ORDER BY timestamp DESC', [urlId]);
    res.json(statsResult.rows);
  } catch (err) {
    console.error('Error fetching click stats:', err);
    res.status(500).json({ message: 'Failed to fetch click stats' });
  }
};

// Get summary stats for a shortId
export const getClickStatsSummaryForShortId = async (req: Request, res: Response) => {
  const { shortId } = req.params;
  try {
    // Get url_id and click_count from shortId
    const urlResult = await pool.query('SELECT id, click_count FROM urls WHERE short_id = $1', [shortId]);
    if (!urlResult.rows.length) {
      return res.status(404).json({ message: 'Short URL not found' });
    }
    const urlId = urlResult.rows[0].id;
    const clickCount = urlResult.rows[0].click_count;

    // Use the helper function to aggregate stats
    const aggregatedStats = await aggregateClickStats(urlId);

    res.json({
      totalClicks: clickCount,
      ...aggregatedStats
    });
  } catch (err) {
    console.error('Error fetching click stats summary:', err);
    res.status(500).json({ message: 'Failed to fetch click stats summary' });
  }
}; 

// Delete a short URL (only by owner)
export const deleteUrl = async (req: Request, res: Response) => {
  const { shortId } = req.params;
  const user = (req as any).user;
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Check if the URL exists and belongs to the user
    const urlResult = await pool.query('SELECT id FROM urls WHERE short_id = $1 AND user_id = $2', [shortId, user.id]);
    if (!urlResult.rows.length) {
      return res.status(404).json({ error: 'URL not found or not owned by user' });
    }
    // Delete the URL
    await pool.query('DELETE FROM urls WHERE short_id = $1 AND user_id = $2', [shortId, user.id]);
    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting URL:', err);
    res.status(500).json({ error: 'Failed to delete URL' });
  }
}; 