import { getDb } from './connection.js';
import bcrypt from 'bcryptjs';

export const seed = (): void => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM trees').get() as { count: number };
  if (row.count > 0) return;

  const passwordHash = bcrypt.hashSync('demo1234', 10);
  const userResult = db.prepare(
    'INSERT INTO users (email, passwordHash, createdAt) VALUES (?, ?, ?)'
  ).run('demo@familytree.app', passwordHash, new Date().toISOString());
  const userId = Number(userResult.lastInsertRowid);

  const treeResult = db.prepare(
    'INSERT INTO trees (name, ownerId, createdAt) VALUES (?, ?, ?)'
  ).run('Thirunagari Family', userId, new Date().toISOString());
  const treeId = Number(treeResult.lastInsertRowid);

  const insertPerson = db.prepare(
    'INSERT INTO persons (treeId, firstName, lastName, birthDate, deathDate, gender, bio) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  db.exec('BEGIN');
  let p: Record<string, number>;
  try {
    const ramakrishnaiah = Number(insertPerson.run(treeId, 'Ramakrishnaiah', 'Thirunagari', null,         null, 'male',   'School Head Master').lastInsertRowid);
    const lakshmDevamma  = Number(insertPerson.run(treeId, 'Lakshmi Devamma','Thirunagari', null,         null, 'female', 'Home maker').lastInsertRowid);
    const raviKumar      = Number(insertPerson.run(treeId, 'Ravi Kumar',     'Thirunagari', '1973-08-31', null, 'male',   'Owner of Chandrika Cell point').lastInsertRowid);
    const sridevi        = Number(insertPerson.run(treeId, 'Sridevi',        'Thirunagari', '1980-02-21', null, 'female', 'Home maker').lastInsertRowid);
    const vyshnavi       = Number(insertPerson.run(treeId, 'Vyshnavi',       'Thirunagari', '2001-08-03', null, 'female', 'Scientific Officer').lastInsertRowid);
    const sriKumar       = Number(insertPerson.run(treeId, 'Sri Kumar',      'Thirunagari', '2004-10-10', null, 'male',   'Working At Moveinsync Company').lastInsertRowid);
    p = { ramakrishnaiah, lakshmDevamma, raviKumar, sridevi, vyshnavi, sriKumar };
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const insertRel = db.prepare(
    'INSERT OR IGNORE INTO relationships (treeId, person1Id, person2Id, type) VALUES (?, ?, ?, ?)'
  );

  db.exec('BEGIN');
  try {
    insertRel.run(treeId, p.ramakrishnaiah, p.lakshmDevamma, 'spouse');
    insertRel.run(treeId, p.ramakrishnaiah, p.raviKumar,     'parent-child');
    insertRel.run(treeId, p.lakshmDevamma,  p.raviKumar,     'parent-child');
    insertRel.run(treeId, p.raviKumar,      p.sridevi,       'spouse');
    insertRel.run(treeId, p.raviKumar,      p.vyshnavi,      'parent-child');
    insertRel.run(treeId, p.raviKumar,      p.sriKumar,      'parent-child');
    insertRel.run(treeId, p.sridevi,        p.vyshnavi,      'parent-child');
    insertRel.run(treeId, p.sridevi,        p.sriKumar,      'parent-child');
    insertRel.run(treeId, p.vyshnavi,       p.sriKumar,      'sibling');
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  console.log('✅ Seeded demo family tree (demo@familytree.app / demo1234)');
};
