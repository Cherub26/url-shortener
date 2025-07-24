import { Router } from 'express';
import { shortenUrl, redirectUrl, getClickStatsForShortId, getClickStatsSummaryForShortId } from '../controllers/urlController';
import { authenticateJWTOptional } from '../middleware/auth';

const router = Router();

router.post('/api/shorten', authenticateJWTOptional, shortenUrl);
router.get('/:shortId', redirectUrl);
router.get('/api/stats/:shortId', getClickStatsForShortId);
router.get('/api/stats/:shortId/summary', getClickStatsSummaryForShortId);

export default router; 