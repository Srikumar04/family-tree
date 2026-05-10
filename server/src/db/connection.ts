import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _db: DatabaseSync | null = null;

export const getDb = (): DatabaseSync => {
  if (!_db) {
    const dbPath = process.env.DB_PATH ?? path.join(__dirname, '../../data/family.db');
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
    _db = new DatabaseSync(dbPath);
    _db.exec('PRAGMA foreign_keys = ON');
    _db.exec('PRAGMA journal_mode = WAL');
  }
  return _db;
};

export const closeDb = (): void => {
  _db?.close();
  _db = null;
};
