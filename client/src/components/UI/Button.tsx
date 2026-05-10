import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  const base = 'inline-flex items-center gap-2 rounded-lg font-body font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-forest text-parchment hover:bg-forest-light',
    secondary: 'border border-forest text-forest hover:bg-forest hover:text-parchment',
    danger: 'bg-red-700 text-white hover:bg-red-800',
    ghost: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
