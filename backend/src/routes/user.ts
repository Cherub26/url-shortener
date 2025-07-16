import { Router } from 'express';
import { register, login, getUserLinks } from '../controllers/userController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/links', authenticateJWT, getUserLinks);

export default router; 