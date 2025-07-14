const db = require('../db/db');
const { generateShortId } = require('../utils/nanoid');

// Helper function to increment click count
async function incrementClickCount(shortId) {
  await db.query('UPDATE urls SET click_count = click_count + 1 WHERE short_id = $1', [shortId]);
}

// Shorten a long URL
exports.shortenUrl = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  const shortId = generateShortId();
  try {
    // Save (shortId, url) to database with click_count initialized to 0
    await db.query(
      'INSERT INTO urls (short_id, original_url, click_count) VALUES ($1, $2, $3)',
      [shortId, url, 0]
    );
    const shortUrl = `${req.protocol}://${req.get('host')}/${shortId}`;
    res.json({ shortUrl });
  } catch (err) {
    console.error('Error saving URL:', err);
    res.status(500).json({ message: 'Failed to shorten URL' });
  }
};

// Redirect to the original URL
exports.redirectUrl = async (req, res) => {
  const { shortId } = req.params;
  try {
    // Look up original URL in database by shortId
    const result = await db.query('SELECT original_url FROM urls WHERE short_id = $1', [shortId]);
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