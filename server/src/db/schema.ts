import { getDb } from './connection.js';

export const initDb = (): void => {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ownerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      shareToken TEXT UNIQUE,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treeId INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      birthDate TEXT,
      deathDate TEXT,
      gender TEXT NOT NULL DEFAULT 'unknown' CHECK(gender IN ('male','female','unknown')),
      bio TEXT,
      photoUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treeId INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      person1Id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
      person2Id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('parent-child','spouse','sibling')),
      UNIQUE(person1Id, person2Id, type)
    );

    CREATE INDEX IF NOT EXISTS idx_persons_tree ON persons(treeId);
    CREATE INDEX IF NOT EXISTS idx_rels_tree ON relationships(treeId);
    CREATE INDEX IF NOT EXISTS idx_trees_owner ON trees(ownerId);
    CREATE INDEX IF NOT EXISTS idx_trees_share ON trees(shareToken);
  `);
};
