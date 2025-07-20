import { Router } from 'express';
import { shortenUrl, redirectUrl } from '../controllers/urlController';
import { authenticateJWTOptional } from '../middleware/auth';

const router = Router();

router.post('/api/shorten', authenticateJWTOptional, shortenUrl);
router.get('/:shortId', redirectUrl);

export default router; 