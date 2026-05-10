import { useMemo } from 'react';
import * as d3 from 'd3';
import type { Person, Relationship } from 'shared';

export const NODE_W = 200;
export const NODE_H = 88;
const H_GAP = 260;
const V_GAP = 160;

export interface LayoutNode {
  person: Person;
  x: number;
  y: number;
  depth: number;
}

export interface LayoutEdge {
  id: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  type: 'parent-child' | 'spouse';
}

interface PersonTree {
  person: Person;
  children: PersonTree[];
}

export function useTreeLayout(persons: Person[], relationships: Relationship[]) {
  return useMemo(() => {
    if (persons.length === 0) return { nodes: [] as LayoutNode[], edges: [] as LayoutEdge[] };

    const personMap = new Map(persons.map(p => [p.id, p]));
    const pcRels = relationships.filter(r => r.type === 'parent-child');
    const spouseRels = relationships.filter(r => r.type === 'spouse');

    // For each child, pick the first recorded parent as the "primary" hierarchy parent.
    // Only one parent enters the D3 hierarchy per child; the other is drawn as a spouse overlay.
    const primaryParent = new Map<number, number>();   // childId → parentId
    const hierarchyChildren = new Map<number, number[]>(); // parentId → childIds

    for (const rel of pcRels) {
      if (!primaryParent.has(rel.person2Id)) {
        primaryParent.set(rel.person2Id, rel.person1Id);
        const arr = hierarchyChildren.get(rel.person1Id) ?? [];
        arr.push(rel.person2Id);
        hierarchyChildren.set(rel.person1Id, arr);
      }
    }

    // Pick the root: the person with no primary parent AND the most hierarchy descendants.
    // Breaking ties by preferring male. This prevents an in-law grandparent from accidentally
    // becoming the root just because their id is numerically smaller.
    const countDescendants = (id: number, seen = new Set<number>()): number => {
      if (seen.has(id)) return 0;
      seen.add(id);
      return (hierarchyChildren.get(id) ?? [])
        .reduce((sum, cid) => sum + 1 + countDescendants(cid, seen), 0);
    };

    const rootCandidates = persons.filter(p => !primaryParent.has(p.id));
    const rootPerson = (rootCandidates.length === 0 ? persons : rootCandidates).reduce((best, p) => {
      const pd = countDescendants(p.id);
      const bd = countDescendants(best.id);
      if (pd > bd) return p;
      if (pd === bd && p.gender === 'male' && best.gender !== 'male') return p;
      return best;
    });

    // Build recursive D3 hierarchy from root, guarded against cycles.
    const visited = new Set<number>();
    function buildTree(id: number): PersonTree | null {
      if (visited.has(id)) return null;
      visited.add(id);
      const person = personMap.get(id);
      if (!person) return null;
      return {
        person,
        children: (hierarchyChildren.get(id) ?? [])
          .map(cid => buildTree(cid))
          .filter((n): n is PersonTree => n !== null),
      };
    }

    const rootTree = buildTree(rootPerson.id);
    if (!rootTree) return { nodes: [] as LayoutNode[], edges: [] as LayoutEdge[] };

    // Run d3.tree() layout — x is horizontal, y is vertical depth.
    const root = d3.hierarchy<PersonTree>(rootTree, n => n.children);
    d3.tree<PersonTree>().nodeSize([H_GAP, V_GAP])(root);

    const posMap = new Map<number, { x: number; y: number; depth: number }>();
    root.descendants().forEach(node => {
      const pos = node as typeof node & { x: number; y: number };
      posMap.set(node.data.person.id, { x: pos.x, y: pos.y, depth: node.depth });
    });

    // Returns the next free x-slot at a given y row, starting from `startX` and stepping
    // by `step` (positive = right, negative = left). Collision radius is half a H_GAP.
    const nextFreeX = (startX: number, y: number, step = H_GAP): number => {
      let x = startX;
      const RADIUS = H_GAP * 0.5;
      while ([...posMap.values()].some(v => v.y === y && Math.abs(v.x - x) < RADIUS)) {
        x += step;
      }
      return x;
    };

    // Place unpositioned spouses adjacent to their positioned partner.
    // Handles multiple spouses: each additional spouse gets the next free slot to the right.
    const applySpouseOverlay = () => {
      for (const rel of spouseRels) {
        const has1 = posMap.has(rel.person1Id);
        const has2 = posMap.has(rel.person2Id);
        if (has1 && !has2) {
          const anchor = posMap.get(rel.person1Id)!;
          const x = nextFreeX(anchor.x + H_GAP, anchor.y);
          posMap.set(rel.person2Id, { x, y: anchor.y, depth: anchor.depth });
        } else if (has2 && !has1) {
          const anchor = posMap.get(rel.person2Id)!;
          // Try right first; if that collides, try left.
          const xRight = nextFreeX(anchor.x + H_GAP, anchor.y);
          const xLeft  = nextFreeX(anchor.x - H_GAP, anchor.y, -H_GAP);
          // Prefer right unless the right slot is farther than the left slot.
          const x = Math.abs(xRight - anchor.x) <= Math.abs(xLeft - anchor.x) ? xRight : xLeft;
          posMap.set(rel.person1Id, { x, y: anchor.y, depth: anchor.depth });
        }
      }
    };

    // Phase 1: place spouses of nodes in the D3 hierarchy.
    applySpouseOverlay();

    // Phase 2: iteratively place any unpositioned person who is a parent of an already-positioned
    // person (in-law parents, great-grandparents, etc.) at the correct generation row.
    // Each iteration may unlock new nodes for subsequent iterations.
    // Cap iterations at persons.length to survive malformed cyclic data.
    const inlawPlaced = new Set<number>();
    let changed = true;
    let safetyCounter = 0;
    while (changed && safetyCounter++ < persons.length) {
      changed = false;
      for (const person of persons) {
        if (posMap.has(person.id)) continue;

        // Find any already-positioned child of this person.
        const childRel = pcRels.find(r => r.person1Id === person.id && posMap.has(r.person2Id));
        if (!childRel) continue;

        const childPos = posMap.get(childRel.person2Id)!;
        const targetY = childPos.y - V_GAP;

        // Place to the right of all nodes currently on this generation row.
        const x = nextFreeX(
          Math.max(...[...posMap.values()].filter(v => v.y === targetY).map(v => v.x), -H_GAP) + H_GAP,
          targetY,
        );
        posMap.set(person.id, { x, y: targetY, depth: childPos.depth - 1 });
        inlawPlaced.add(person.id);
        changed = true;
      }
      // Re-run spouse overlay so the in-law's partner lands on the same row.
      applySpouseOverlay();
    }

    // Collect all in-law IDs (Phase-2 placed + their spouses) for edge drawing.
    const inlawIds = new Set<number>(inlawPlaced);
    for (const rel of spouseRels) {
      if (inlawPlaced.has(rel.person1Id)) inlawIds.add(rel.person2Id);
      if (inlawPlaced.has(rel.person2Id)) inlawIds.add(rel.person1Id);
    }

    // Phase 3: any person still unpositioned has no relationship connection at all.
    // Group them in a row below the tree so they're visible but clearly detached.
    const maxY = Math.max(...[...posMap.values()].map(p => p.y), 0);
    let orphanX = 0;
    for (const person of persons) {
      if (!posMap.has(person.id)) {
        posMap.set(person.id, { x: orphanX, y: maxY + V_GAP, depth: 0 });
        orphanX += H_GAP;
      }
    }

    // ── Nodes ──────────────────────────────────────────────────────────────────
    const nodes: LayoutNode[] = persons.map(person => {
      const pos = posMap.get(person.id)!;
      return { person, x: pos.x, y: pos.y, depth: pos.depth };
    });

    // ── Edges ──────────────────────────────────────────────────────────────────
    const edges: LayoutEdge[] = [];

    // Parent-child edges for the main D3 hierarchy branch.
    root.links().forEach(link => {
      const s = link.source as typeof link.source & { x: number; y: number };
      const t = link.target as typeof link.target & { x: number; y: number };
      edges.push({
        id: `pc-${link.source.data.person.id}-${link.target.data.person.id}`,
        sx: s.x, sy: s.y + NODE_H / 2,
        tx: t.x, ty: t.y - NODE_H / 2,
        type: 'parent-child',
      });
    });

    // Parent-child edges from in-law parents (Phase-2 placed + their spouses) to their children.
    // Avoids duplicating edges that are already in the D3 hierarchy.
    const d3EdgeKeys = new Set(root.links().map(l =>
      `${l.source.data.person.id}-${l.target.data.person.id}`
    ));
    for (const rel of pcRels) {
      if (!inlawIds.has(rel.person1Id)) continue;
      if (d3EdgeKeys.has(`${rel.person1Id}-${rel.person2Id}`)) continue;
      const p1 = posMap.get(rel.person1Id);
      const p2 = posMap.get(rel.person2Id);
      if (!p1 || !p2) continue;
      edges.push({
        id: `pc-inlaw-${rel.person1Id}-${rel.person2Id}`,
        sx: p1.x, sy: p1.y + NODE_H / 2,
        tx: p2.x, ty: p2.y - NODE_H / 2,
        type: 'parent-child',
      });
    }

    // Spouse edges (dashed horizontal line between partners).
    for (const rel of spouseRels) {
      const p1 = posMap.get(rel.person1Id);
      const p2 = posMap.get(rel.person2Id);
      if (!p1 || !p2) continue;
      const left  = p1.x < p2.x ? p1 : p2;
      const right = p1.x < p2.x ? p2 : p1;
      edges.push({
        id: `spouse-${rel.id}`,
        sx: left.x  + NODE_W / 2, sy: left.y,
        tx: right.x - NODE_W / 2, ty: right.y,
        type: 'spouse',
      });
    }

    return { nodes, edges };
  }, [persons, relationships]);
}
