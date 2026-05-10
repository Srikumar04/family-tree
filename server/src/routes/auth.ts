import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from '../db/connection.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import { RegisterSchema, LoginSchema } from 'shared';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post('/register', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }
    const { email, password } = parsed.data;
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (email, passwordHash, createdAt) VALUES (?, ?, ?)'
    ).run(email, passwordHash, new Date().toISOString());
    const userId = result.lastInsertRowid as number;
    const token = signToken(userId);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ user: { id: userId, email } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }
    const { email, password } = parsed.data;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
      | { id: number; email: string; passwordHash: string }
      | undefined;
    if (!user || !comparePassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = signToken(user.id);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', (req: Request, res: Response): void => {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const payload = verifyToken(token);
    const db = getDb();
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(payload.sub) as
      | { id: number; email: string }
      | undefined;
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
