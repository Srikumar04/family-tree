import { Router, Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';
import { CreateTreeSchema, CreatePersonSchema, UpdatePersonSchema, CreateRelationshipSchema } from 'shared';
import type { Tree, Person, Relationship } from 'shared';

const router = Router();

const assertOwner = (
  treeId: number,
  userId: number,
  res: Response
): boolean => {
  const db = getDb();
  const tree = db.prepare('SELECT id FROM trees WHERE id = ? AND ownerId = ?').get(treeId, userId);
  if (!tree) {
    res.status(404).json({ error: 'Tree not found' });
    return false;
  }
  return true;
};

// ── Trees CRUD ──────────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const db = getDb();
    const trees = db.prepare('SELECT * FROM trees WHERE ownerId = ? ORDER BY createdAt DESC').all(req.userId) as Tree[];
    res.json(trees);
  } catch (err) { next(err); }
});

router.post('/', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const parsed = CreateTreeSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.issues }); return; }
    const db = getDb();
    const result = db.prepare('INSERT INTO trees (name, ownerId, createdAt) VALUES (?, ?, ?)').run(parsed.data.name, req.userId, new Date().toISOString());
    const tree = db.prepare('SELECT * FROM trees WHERE id = ?').get(result.lastInsertRowid) as Tree;
    res.status(201).json(tree);
  } catch (err) { next(err); }
});

router.delete('/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const db = getDb();
    db.prepare('DELETE FROM trees WHERE id = ?').run(treeId);
    res.status(204).send();
  } catch (err) { next(err); }
});

// ── Share token ──────────────────────────────────────────────────────────────

router.post('/:id/share', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const db = getDb();
    const token = nanoid(12);
    db.prepare('UPDATE trees SET shareToken = ? WHERE id = ?').run(token, treeId);
    res.json({ shareToken: token });
  } catch (err) { next(err); }
});

// ── Persons ──────────────────────────────────────────────────────────────────

router.get('/:id/persons', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const db = getDb();
    const persons = db.prepare('SELECT * FROM persons WHERE treeId = ?').all(treeId) as Person[];
    res.json(persons);
  } catch (err) { next(err); }
});

router.post('/:id/persons', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const parsed = CreatePersonSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.issues }); return; }
    const { firstName, lastName, birthDate, deathDate, gender, bio, photoUrl } = parsed.data;
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO persons (treeId, firstName, lastName, birthDate, deathDate, gender, bio, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(treeId, firstName, lastName, birthDate ?? null, deathDate ?? null, gender, bio ?? null, photoUrl ?? null);
    const person = db.prepare('SELECT * FROM persons WHERE id = ?').get(result.lastInsertRowid) as Person;
    res.status(201).json(person);
  } catch (err) { next(err); }
});

router.put('/:id/persons/:pid', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const personId = parseInt(req.params.pid);
    const parsed = UpdatePersonSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.issues }); return; }
    const db = getDb();
    const existing = db.prepare('SELECT * FROM persons WHERE id = ? AND treeId = ?').get(personId, treeId) as Person | undefined;
    if (!existing) { res.status(404).json({ error: 'Person not found' }); return; }
    const merged = { ...existing, ...parsed.data };
    db.prepare(
      'UPDATE persons SET firstName=?, lastName=?, birthDate=?, deathDate=?, gender=?, bio=?, photoUrl=? WHERE id=?'
    ).run(merged.firstName, merged.lastName, merged.birthDate, merged.deathDate, merged.gender, merged.bio, merged.photoUrl, personId);
    const updated = db.prepare('SELECT * FROM persons WHERE id = ?').get(personId) as Person;
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id/persons/:pid', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const personId = parseInt(req.params.pid);
    const db = getDb();
    const result = db.prepare('DELETE FROM persons WHERE id = ? AND treeId = ?').run(personId, treeId);
    if (result.changes === 0) { res.status(404).json({ error: 'Person not found' }); return; }
    res.status(204).send();
  } catch (err) { next(err); }
});

// ── Relationships ─────────────────────────────────────────────────────────────

router.get('/:id/relationships', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const db = getDb();
    const rels = db.prepare('SELECT * FROM relationships WHERE treeId = ?').all(treeId) as Relationship[];
    res.json(rels);
  } catch (err) { next(err); }
});

router.post('/:id/relationships', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const parsed = CreateRelationshipSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.issues }); return; }
    const { person1Id, person2Id, type } = parsed.data;
    if (person1Id === person2Id) { res.status(400).json({ error: 'A person cannot have a relationship with themselves' }); return; }
    const db = getDb();
    // Verify both persons belong to this tree
    const p1 = db.prepare('SELECT id FROM persons WHERE id = ? AND treeId = ?').get(person1Id, treeId);
    const p2 = db.prepare('SELECT id FROM persons WHERE id = ? AND treeId = ?').get(person2Id, treeId);
    if (!p1 || !p2) { res.status(400).json({ error: 'Both persons must belong to this tree' }); return; }
    try {
      const result = db.prepare(
        'INSERT INTO relationships (treeId, person1Id, person2Id, type) VALUES (?, ?, ?, ?)'
      ).run(treeId, person1Id, person2Id, type);
      const rel = db.prepare('SELECT * FROM relationships WHERE id = ?').get(result.lastInsertRowid) as Relationship;
      res.status(201).json(rel);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('UNIQUE')) {
        res.status(409).json({ error: 'Relationship already exists' });
      } else {
        throw e;
      }
    }
  } catch (err) { next(err); }
});

router.delete('/:id/relationships/:rid', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const treeId = parseInt(req.params.id);
    if (!assertOwner(treeId, req.userId!, res)) return;
    const relId = parseInt(req.params.rid);
    const db = getDb();
    const result = db.prepare('DELETE FROM relationships WHERE id = ? AND treeId = ?').run(relId, treeId);
    if (result.changes === 0) { res.status(404).json({ error: 'Relationship not found' }); return; }
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
