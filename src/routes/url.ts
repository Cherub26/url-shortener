import { Router } from 'express';
import { shortenUrl, redirectUrl, getClickStatsForShortId, getClickStatsSummaryForShortId, deleteUrl, updateUrlExpiration } from '../controllers/urlController';
import { authenticateJWT, authenticateJWTOptional } from '../middleware/auth';

const router = Router();

router.post('/shorten', authenticateJWTOptional, shortenUrl);
router.get('/:shortId', redirectUrl);
router.get('/stats/:shortId', getClickStatsForShortId);
router.get('/stats/:shortId/summary', getClickStatsSummaryForShortId);
router.delete('/shorten/:shortId', authenticateJWT, deleteUrl);
router.post('/shorten/:shortId/expiration', authenticateJWT, updateUrlExpiration);

export default router; 