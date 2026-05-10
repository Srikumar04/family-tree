import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/schema.js';
import { seed } from './db/seed.js';
import { authGuard } from './middleware/authGuard.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import treesRouter from './routes/trees.js';
import shareRouter from './routes/share.js';
import uploadRouter from './routes/upload.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR ?? path.join(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/share', shareRouter);

// Protected routes
app.use('/api/trees', authGuard, treesRouter);
app.use('/api/upload', authGuard, uploadRouter);

app.use(errorHandler);

// Serve built React app in production (must be after API routes)
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Initialize DB and seed
initDb();
seed();

const PORT = parseInt(process.env.PORT ?? '3001');
app.listen(PORT, () => {
  console.log(`🌳 Family Tree server running on http://localhost:${PORT}`);
});

export { app };
