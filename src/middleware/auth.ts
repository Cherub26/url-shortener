import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Factory function to create authentication middleware
function createAuthMiddleware(required: boolean = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (required) {
        return res.status(401).json({ error: 'No token provided' });
      }
      return next(); // Continue without authentication
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; user_id: string; username: string };
      (req as any).user = decoded;
      next();
    } catch (err) {
      if (required) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      next(); // Continue without authentication if token is invalid
    }
  };
}

// Export the middleware instances
export const authenticateJWT = createAuthMiddleware(true);
export const authenticateJWTOptional = createAuthMiddleware(false); 