import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/photo', upload.single('photo'), (req: Request, res: Response): void => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const photoUrl = `/uploads/${req.file.filename}`;
  res.json({ photoUrl });
});

export default router;
