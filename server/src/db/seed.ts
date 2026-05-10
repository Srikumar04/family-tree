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
    const ramesh = Number(insertPerson.run(treeId, 'Ramesh', 'Sharma', '1945-03-12', '2010-08-05', 'male', 'Patriarch of the Sharma family. Retired schoolteacher who loved cricket and gardening.').lastInsertRowid);
    const kamla  = Number(insertPerson.run(treeId, 'Kamla',  'Sharma', '1948-07-22', null,         'female', 'Matriarch of the family. Known for her exceptional cooking and warm hospitality.').lastInsertRowid);
    const arjun  = Number(insertPerson.run(treeId, 'Arjun',  'Sharma', '1972-11-03', null,         'male', 'Software engineer based in Bangalore. Loves hiking and photography.').lastInsertRowid);
    const meera  = Number(insertPerson.run(treeId, 'Meera',  'Sharma', '1975-04-18', null,         'female', 'Doctor specialising in paediatrics. Lives in Mumbai.').lastInsertRowid);
    const priya  = Number(insertPerson.run(treeId, 'Priya',  'Sharma', '1974-09-30', null,         'female', 'Architect and urban planner. Met Arjun in college.').lastInsertRowid);
    const aanya  = Number(insertPerson.run(treeId, 'Aanya',  'Sharma', '2001-06-15', null,         'female', 'University student studying design.').lastInsertRowid);
    const rohan  = Number(insertPerson.run(treeId, 'Rohan',  'Sharma', '2003-02-28', null,         'male', 'High school student and aspiring musician.').lastInsertRowid);
    const dev    = Number(insertPerson.run(treeId, 'Dev',    'Sharma', '2007-12-10', null,         'male', 'The youngest — curious and full of energy.').lastInsertRowid);
    p = { ramesh, kamla, arjun, meera, priya, aanya, rohan, dev };
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
    insertRel.run(treeId, p.ramesh, p.kamla,  'spouse');
    insertRel.run(treeId, p.arjun,  p.priya,  'spouse');
    insertRel.run(treeId, p.ramesh, p.arjun,  'parent-child');
    insertRel.run(treeId, p.ramesh, p.meera,  'parent-child');
    insertRel.run(treeId, p.kamla,  p.arjun,  'parent-child');
    insertRel.run(treeId, p.kamla,  p.meera,  'parent-child');
    insertRel.run(treeId, p.arjun,  p.aanya,  'parent-child');
    insertRel.run(treeId, p.arjun,  p.rohan,  'parent-child');
    insertRel.run(treeId, p.arjun,  p.dev,    'parent-child');
    insertRel.run(treeId, p.priya,  p.aanya,  'parent-child');
    insertRel.run(treeId, p.priya,  p.rohan,  'parent-child');
    insertRel.run(treeId, p.priya,  p.dev,    'parent-child');
    insertRel.run(treeId, p.arjun,  p.meera,  'sibling');
    insertRel.run(treeId, p.aanya,  p.rohan,  'sibling');
    insertRel.run(treeId, p.aanya,  p.dev,    'sibling');
    insertRel.run(treeId, p.rohan,  p.dev,    'sibling');
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  console.log('✅ Seeded demo family tree (demo@familytree.app / demo1234)');
};
