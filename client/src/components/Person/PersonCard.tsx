import type { Person } from 'shared';
import { mediaBase } from '../../api/mediaUrl';

const GENDER_COLORS = { male: '#3D6B20', female: '#be123c', unknown: '#C9A84C' };

interface Props {
  person: Person;
  onClick?: () => void;
  compact?: boolean;
}

function formatYear(d: string | null) { return d ? d.slice(0, 4) : null; }

export default function PersonCard({ person, onClick, compact }: Props) {
  const initials = `${person.firstName[0]}${person.lastName[0]}`;
  const color = GENDER_COLORS[person.gender];
  const birth = formatYear(person.birthDate);
  const death = formatYear(person.deathDate);

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:border-gold cursor-pointer transition-colors ${compact ? '' : 'bg-[var(--color-surface)]'}`}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>
        {person.photoUrl
          ? <img src={`${mediaBase}${person.photoUrl}`} alt="" className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-heading text-sm font-bold text-[var(--color-text)] truncate">{person.firstName} {person.lastName}</div>
        {(birth || death) && (
          <div className="font-body text-xs text-[var(--color-text-muted)]">
            {birth ?? '?'}{death ? ` – ${death}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}
