import { Router } from 'express';
import { shortenUrl, redirectUrl, getClickStatsForShortId, getClickStatsSummaryForShortId, deleteUrl } from '../controllers/urlController';
import { authenticateJWT, authenticateJWTOptional } from '../middleware/auth';

const router = Router();

router.post('/api/shorten', authenticateJWTOptional, shortenUrl);
router.get('/:shortId', redirectUrl);
router.get('/api/stats/:shortId', getClickStatsForShortId);
router.get('/api/stats/:shortId/summary', getClickStatsSummaryForShortId);
router.delete('/api/shorten/:shortId', authenticateJWT, deleteUrl);

export default router; 