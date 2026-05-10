import { NODE_W, NODE_H } from './useTreeLayout';
import type { LayoutNode } from './useTreeLayout';
import { mediaBase } from '../../api/mediaUrl';

const GENDER_COLORS = {
  male: '#3D6B20',
  female: '#be123c',
  unknown: '#C9A84C',
};

interface Props {
  node: LayoutNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function formatYear(dateStr: string | null): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 4);
}

export default function TreeNode({ node, isSelected, isHighlighted, isDimmed, onClick, onMouseEnter, onMouseLeave }: Props) {
  const { person, x, y } = node;
  const borderColor = GENDER_COLORS[person.gender];
  const photoInitials = `${person.firstName[0]}${person.lastName[0]}`;
  const years = [formatYear(person.birthDate), formatYear(person.deathDate)].filter(Boolean).join(' – ');

  return (
    <foreignObject
      x={x - NODE_W / 2}
      y={y - NODE_H / 2}
      width={NODE_W}
      height={NODE_H}
      style={{ overflow: 'visible', opacity: isDimmed ? 0.25 : 1, transition: 'opacity 0.2s' }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          width: NODE_W,
          height: NODE_H,
          borderLeft: `4px solid ${borderColor}`,
          outline: isSelected ? `2px solid ${borderColor}` : isHighlighted ? `2px solid #C9A84C` : 'none',
          outlineOffset: 2,
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.15s, outline 0.15s',
          cursor: 'pointer',
          background: 'var(--color-surface)',
          borderRadius: '8px',
          boxShadow: isSelected ? '0 4px 16px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 10px',
          fontFamily: '"Lora", Georgia, serif',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: borderColor, flexShrink: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 14, fontWeight: 700,
        }}>
          {person.photoUrl ? (
            <img src={`${mediaBase}${person.photoUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : photoInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {person.firstName} {person.lastName}
          </div>
          {years && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{years}</div>}
          {person.deathDate && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>✝</div>}
        </div>
      </div>
    </foreignObject>
  );
}
