'use client';

import { cn } from '@/lib/utils';

export function MultiSelectChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 px-3.5 py-1.5 text-sm transition-all',
        selected
          ? 'border-primary-container bg-primary-container font-semibold text-on-surface'
          : 'border-surface-variant bg-white text-secondary hover:border-primary-container/50',
      )}
    >
      {label}
    </button>
  );
}
