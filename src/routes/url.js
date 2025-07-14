const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');

// API route to shorten a URL
router.post('/api/shorten', urlController.shortenUrl);

// Route to handle redirection
router.get('/:shortId', urlController.redirectUrl);

module.exports = router; 