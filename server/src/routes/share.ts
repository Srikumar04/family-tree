import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from '../db/connection.js';
import type { Tree, Person, Relationship } from 'shared';

const router = Router();

router.get('/:token', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const db = getDb();
    const tree = db.prepare('SELECT * FROM trees WHERE shareToken = ?').get(req.params.token) as Tree | undefined;
    if (!tree) { res.status(404).json({ error: 'Shared tree not found' }); return; }
    const persons = db.prepare('SELECT * FROM persons WHERE treeId = ?').all(tree.id) as Person[];
    const relationships = db.prepare('SELECT * FROM relationships WHERE treeId = ?').all(tree.id) as Relationship[];
    res.json({ tree, persons, relationships });
  } catch (err) { next(err); }
});

export default router;
