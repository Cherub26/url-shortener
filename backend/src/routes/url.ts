import { Router } from 'express';
import { shortenUrl, redirectUrl } from '../controllers/urlController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/api/shorten', authenticateJWT, shortenUrl);
router.get('/:shortId', redirectUrl);

export default router; 