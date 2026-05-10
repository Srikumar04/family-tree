import type { LayoutEdge } from './useTreeLayout';

export default function TreeEdge({ edge }: { edge: LayoutEdge }) {
  if (edge.type === 'parent-child') {
    const midY = (edge.sy + edge.ty) / 2;
    const d = `M ${edge.sx} ${edge.sy} C ${edge.sx} ${midY}, ${edge.tx} ${midY}, ${edge.tx} ${edge.ty}`;
    return <path d={d} stroke="var(--color-primary)" strokeWidth={1.5} fill="none" opacity={0.6} />;
  }
  // Spouse
  return (
    <line
      x1={edge.sx} y1={edge.sy}
      x2={edge.tx} y2={edge.ty}
      stroke="#C9A84C" strokeWidth={2} strokeDasharray="6,4" opacity={0.8}
    />
  );
}
