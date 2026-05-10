import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const authGuard = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
