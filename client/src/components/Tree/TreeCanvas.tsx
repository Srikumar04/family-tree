import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useTreeLayout } from './useTreeLayout';
import TreeNode from './TreeNode';
import TreeEdge from './TreeEdge';
import type { Person, Relationship } from 'shared';

interface Props {
  persons: Person[];
  relationships: Relationship[];
  selectedPersonId: number | null;
  searchQuery: string;
  onSelectPerson: (id: number | null) => void;
}

export default function TreeCanvas({ persons, relationships, selectedPersonId, searchQuery, onSelectPerson }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const { nodes, edges } = useTreeLayout(persons, relationships);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Determine ancestors/descendants of hovered node for highlight
  const getRelatedIds = useCallback((personId: number | null): Set<number> => {
    if (!personId) return new Set();
    const related = new Set<number>();
    const pcRels = relationships.filter(r => r.type === 'parent-child');
    // BFS upward (ancestors)
    const upQueue = [personId];
    while (upQueue.length) {
      const id = upQueue.shift()!;
      related.add(id);
      pcRels.filter(r => r.person2Id === id).forEach(r => { if (!related.has(r.person1Id)) upQueue.push(r.person1Id); });
    }
    // BFS downward (descendants)
    const downQueue = [personId];
    const seen = new Set<number>();
    while (downQueue.length) {
      const id = downQueue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      related.add(id);
      pcRels.filter(r => r.person1Id === id).forEach(r => { if (!seen.has(r.person2Id)) downQueue.push(r.person2Id); });
    }
    // Add spouses of related
    relationships.filter(r => r.type === 'spouse').forEach(r => {
      if (related.has(r.person1Id)) related.add(r.person2Id);
      if (related.has(r.person2Id)) related.add(r.person1Id);
    });
    return related;
  }, [relationships]);

  const highlightFocusId = hoveredId ?? selectedPersonId;
  const relatedIds = getRelatedIds(highlightFocusId);
  const hasHighlight = highlightFocusId !== null && relatedIds.size > 0;

  // Search match
  const searchLower = searchQuery.toLowerCase();
  const matchedIds = searchQuery
    ? new Set(persons.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchLower)
      ).map(p => p.id))
    : null;

  // Set up D3 zoom
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', event => {
        svg.select<SVGGElement>('.zoom-container').attr('transform', event.transform.toString());
      });
    zoomRef.current = zoom;
    svg.call(zoom);
    // Initial centering
    const { width, height } = svgRef.current.getBoundingClientRect();
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 4));
    return () => { svg.on('.zoom', null); };
  }, []);

  // Re-center when tree data changes
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current || nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    const { width, height } = svgRef.current.getBoundingClientRect();
    svg.transition().duration(500).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(width / 2, height / 4)
    );
  }, [persons.length]); // re-center when person count changes

  if (persons.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="tree-canvas w-full h-full"
      onClick={() => onSelectPerson(null)}
    >
      <g className="zoom-container">
        {/* Edges below nodes */}
        {edges.map(edge => <TreeEdge key={edge.id} edge={edge} />)}
        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = node.person.id === selectedPersonId;
          const isHighlighted = hasHighlight ? relatedIds.has(node.person.id) : false;
          const isDimmed = (hasHighlight && !relatedIds.has(node.person.id)) ||
                           (matchedIds !== null && !matchedIds.has(node.person.id));
          return (
            <TreeNode
              key={node.person.id}
              node={node}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isDimmed={isDimmed}
              onClick={e => { (e as unknown as Event).stopPropagation?.(); onSelectPerson(node.person.id); }}
              onMouseEnter={() => setHoveredId(node.person.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          );
        })}
      </g>
    </svg>
  );
}
