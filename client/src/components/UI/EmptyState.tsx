interface Props {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mb-6 opacity-40">
        <rect x="10" y="60" width="100" height="30" rx="4" fill="#C9A84C" />
        <rect x="30" y="35" width="60" height="30" rx="4" fill="#2D5016" />
        <rect x="50" y="10" width="20" height="30" rx="4" fill="#2D5016" />
        <circle cx="60" cy="8" r="8" fill="#C9A84C" />
        <line x1="60" y1="35" x2="60" y2="60" stroke="#2D5016" strokeWidth="2" />
        <line x1="30" y1="65" x2="90" y2="65" stroke="#C9A84C" strokeWidth="2" />
        <line x1="30" y1="65" x2="30" y2="75" stroke="#C9A84C" strokeWidth="2" />
        <line x1="90" y1="65" x2="90" y2="75" stroke="#C9A84C" strokeWidth="2" />
      </svg>
      <h3 className="font-heading text-2xl text-forest dark:text-gold mb-2">{title}</h3>
      <p className="font-body text-[var(--color-text-muted)] mb-6 max-w-sm">{description}</p>
      {action && (
        <button className="btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
