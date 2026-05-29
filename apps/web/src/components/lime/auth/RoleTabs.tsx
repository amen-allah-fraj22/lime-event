'use client';

import { cn } from '@/lib/utils';

export type AuthRole = 'artist' | 'organizer' | 'agency';

const ROLES: { id: AuthRole; label: string }[] = [
  { id: 'artist', label: 'Artist' },
  { id: 'organizer', label: 'Organizer' },
  { id: 'agency', label: 'Agency' },
];

export function RoleTabs({
  value,
  onChange,
}: {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
}) {
  return (
    <div className="mb-8 flex rounded-full bg-surface-container p-1">
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onChange(r.id)}
          className={cn(
            'flex-1 rounded-full px-4 py-2 text-center text-label-md transition-all duration-200',
            value === r.id
              ? 'bg-primary-container font-semibold text-custom-dark'
              : 'bg-transparent text-secondary hover:text-on-surface',
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
