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

    // For each child, pick the first parent as the "primary" hierarchy parent
    const primaryParent = new Map<number, number>(); // childId → parentId
    const hierarchyChildren = new Map<number, number[]>(); // parentId → childIds

    for (const rel of pcRels) {
      if (!primaryParent.has(rel.person2Id)) {
        primaryParent.set(rel.person2Id, rel.person1Id);
        const arr = hierarchyChildren.get(rel.person1Id) ?? [];
        arr.push(rel.person2Id);
        hierarchyChildren.set(rel.person1Id, arr);
      }
    }

    // Find root: person with no primary parent (prefer male or oldest)
    const rootPerson =
      persons.find(p => !primaryParent.has(p.id) && p.gender === 'male') ??
      persons.find(p => !primaryParent.has(p.id)) ??
      persons[0];

    // Build recursive hierarchy
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

    // Run d3.tree() layout
    const root = d3.hierarchy<PersonTree>(rootTree, n => n.children);
    d3.tree<PersonTree>().nodeSize([H_GAP, V_GAP])(root);

    const posMap = new Map<number, { x: number; y: number; depth: number }>();
    root.descendants().forEach(node => {
      const pos = node as typeof node & { x: number; y: number };
      posMap.set(node.data.person.id, { x: pos.x, y: pos.y, depth: node.depth });
    });

    // Position spouses adjacent to their in-hierarchy partner
    const spouseOverlayIds = new Set<number>();
    for (const rel of spouseRels) {
      const has1 = posMap.has(rel.person1Id);
      const has2 = posMap.has(rel.person2Id);
      if (has1 && !has2) {
        const p = posMap.get(rel.person1Id)!;
        posMap.set(rel.person2Id, { x: p.x + H_GAP, y: p.y, depth: p.depth });
        spouseOverlayIds.add(rel.person2Id);
      } else if (has2 && !has1) {
        const p = posMap.get(rel.person2Id)!;
        posMap.set(rel.person1Id, { x: p.x - H_GAP, y: p.y, depth: p.depth });
        spouseOverlayIds.add(rel.person1Id);
      }
    }

    // Any remaining persons not positioned → place in a row below all
    const maxY = Math.max(...Array.from(posMap.values()).map(p => p.y), 0);
    let orphanX = 0;
    for (const person of persons) {
      if (!posMap.has(person.id)) {
        posMap.set(person.id, { x: orphanX, y: maxY + V_GAP, depth: 0 });
        orphanX += H_GAP;
      }
    }

    const nodes: LayoutNode[] = persons.map(person => {
      const pos = posMap.get(person.id)!;
      return { person, x: pos.x, y: pos.y, depth: pos.depth };
    });

    const edges: LayoutEdge[] = [];

    // Parent-child edges from d3 hierarchy links
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

    // Spouse edges
    for (const rel of spouseRels) {
      const p1 = posMap.get(rel.person1Id);
      const p2 = posMap.get(rel.person2Id);
      if (p1 && p2) {
        const left = p1.x < p2.x ? p1 : p2;
        const right = p1.x < p2.x ? p2 : p1;
        edges.push({
          id: `spouse-${rel.id}`,
          sx: left.x + NODE_W / 2, sy: left.y,
          tx: right.x - NODE_W / 2, ty: right.y,
          type: 'spouse',
        });
      }
    }

    return { nodes, edges };
  }, [persons, relationships]);
}
