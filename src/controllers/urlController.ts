import { Request, Response } from 'express';
import path from 'path';
import pool from '../db/db';
import { generateUniqueShortId } from '../utils/nanoid';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';
import redis from '../utils/redis';
import { clickStatsQueue } from '../utils/queue';
import { AggregatedStatsRow, UrlIdRow, ClickStatsRow } from '../types/database';

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

  statsResult.rows.forEach((row: AggregatedStatsRow) => {
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
  const { url, expires_at } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  try {
    const shortId = await generateUniqueShortId();
    
    // If user is authenticated, associate user_id
    const userId = req.user?.id || null;
    let expiresAtUTC = null;
    if (expires_at) {
      // Parse and convert to UTC string
      const date = new Date(expires_at);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid expiration date' });
      }
      // Prevent setting expiration in the past
      if (date < new Date()) {
        return res.status(400).json({ message: 'Expiration date must be in the future' });
      }
      expiresAtUTC = date.toISOString();
    }
    if (userId) {
      await pool.query(
        'INSERT INTO urls (short_id, original_url, click_count, user_id, expires_at, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [shortId, url, 0, userId, expiresAtUTC, true]
      );
    } else {
      await pool.query(
        'INSERT INTO urls (short_id, original_url, click_count, expires_at, is_active) VALUES ($1, $2, $3, $4, $5)',
        [shortId, url, 0, expiresAtUTC, true]
      );
    }
    const shortUrl = `${req.protocol}://${req.get('host')}/api/${shortId}`;
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
    let isActive: boolean | null = null;
    let expiresAt: string | null = null;
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        originalUrl = parsed.original_url;
        urlId = parsed.url_id;
        isActive = parsed.is_active;
        expiresAt = parsed.expires_at;
      } catch (e) {}
    }
    if (originalUrl && urlId && isActive !== null) {
      // Check expiration - compare UTC times
      const now = new Date().toISOString();
      if (!isActive || (expiresAt && expiresAt < now)) {
        // If isActive is true and the URL is expired, update the cache to set is_active to false
        if (isActive && expiresAt && expiresAt < now) {
          await redis.set(cacheKey, JSON.stringify({
            original_url: originalUrl,
            url_id: urlId,
            is_active: false,
            expires_at: expiresAt
          }), 'EX', 600);
        }
        return res.status(410)
          .set('Cache-Control', 'no-cache, no-store, must-revalidate')
          .set('Pragma', 'no-cache')
          .set('Expires', '0')
          .json({ error: 'This link has expired or is inactive.' });
      }
      // Use 307 redirect with cache control headers to prevent browser caching
      res.status(307)
        .set('Cache-Control', 'no-cache, no-store, must-revalidate')
        .set('Pragma', 'no-cache')
        .set('Expires', '0')
        .set('Location', originalUrl as string)
        .send();
      // Collect click stats asynchronously
      await collectClickStats(urlId!, shortId, req);
      return;
    }
    // Not in cache, look up original URL, id, is_active, expires_at in database by shortId
    const result = await pool.query('SELECT id, original_url, is_active, expires_at FROM urls WHERE short_id = $1', [shortId]);
    if (result.rows.length) {
      const urlRow = result.rows[0];
      urlId = urlRow.id;
      originalUrl = urlRow.original_url;
      isActive = urlRow.is_active;
      expiresAt = urlRow.expires_at;
      // Check expiration - compare UTC times
      const now = new Date().toISOString();
      if (!isActive || (expiresAt && expiresAt < now)) {
        // Optionally, update is_active in DB if expired
        if (isActive && expiresAt && expiresAt < now) {
          await pool.query('UPDATE urls SET is_active = FALSE WHERE id = $1', [urlId]);
        }
        return res.status(410)
          .set('Cache-Control', 'no-cache, no-store, must-revalidate')
          .set('Pragma', 'no-cache')
          .set('Expires', '0')
          .json({ error: 'This link has expired or is inactive.' });
      }
      // Use 307 redirect with cache control headers to prevent browser caching
      res.status(307)
        .set('Location', originalUrl as string)
        .send();
      
      // Collect click stats asynchronously
      await collectClickStats(urlId!, shortId, req);
      // Cache with is_active and expires_at
      await redis.set(cacheKey, JSON.stringify({
        original_url: originalUrl,
        url_id: urlId,
        is_active: isActive,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      }), 'EX', 600);
      return;
    } else {
      return res.status(404)
        .set('Cache-Control', 'no-cache, no-store, must-revalidate')
        .set('Pragma', 'no-cache')
        .set('Expires', '0')
        .json({ error: 'Short URL not found' });
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
    const urlRow = urlResult.rows[0] as UrlIdRow;
    const urlId = urlRow.id;
    // Get all click stats for this url_id
    const statsResult = await pool.query('SELECT * FROM click_stats WHERE url_id = $1 ORDER BY timestamp DESC', [urlId]);
    res.json(statsResult.rows as ClickStatsRow[]);
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
    const urlRow = urlResult.rows[0] as UrlIdRow;
    const urlId = urlRow.id;
    const clickCount = urlRow.click_count!;

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
  const user = req.user;
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

// Update expiration date of a short URL (only by owner)
export const updateUrlExpiration = async (req: Request, res: Response) => {
  const { shortId } = req.params;
  const { expires_at } = req.body;
  const user = req.user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (expires_at === undefined) {
    return res.status(400).json({ error: 'expires_at field is required' });
  }

  try {
    // Check if the URL exists and belongs to the user
    const urlResult = await pool.query('SELECT id FROM urls WHERE short_id = $1 AND user_id = $2', [shortId, user.id]);
    if (!urlResult.rows.length) {
      return res.status(404).json({ error: 'URL not found or not owned by user' });
    }

    let expiresAtUTC = null;
    if (expires_at !== null) {
      // Parse and convert to UTC string
      const date = new Date(expires_at);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid expiration date' });
      }
      // Prevent setting expiration in the past
      if (date < new Date()) {
        return res.status(400).json({ error: 'Expiration date must be in the future' });
      }
      expiresAtUTC = date.toISOString();
    }

    // Update the expiration date
    await pool.query('UPDATE urls SET expires_at = $1, is_active = TRUE WHERE short_id = $2 AND user_id = $3', [expiresAtUTC, shortId, user.id]);

    // Clear cache if it exists
    const cacheKey = `shorturl:${shortId}`;
    await redis.del(cacheKey);

    res.json({ 
      message: 'Expiration date updated successfully',
      expires_at: expiresAtUTC 
    });
  } catch (err) {
    console.error('Error updating URL expiration:', err);
    res.status(500).json({ error: 'Failed to update expiration date' });
  }
}; 