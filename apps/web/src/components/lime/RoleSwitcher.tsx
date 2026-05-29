'use client';

import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import type { ContextSwitchRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<ContextSwitchRole, string> = {
  artist: 'Artist',
  organizer: 'Organizer',
};

export function RoleSwitcher({ className }: { className?: string }) {
  const { switchableRoles, activeRole, setActiveRole, canUseSwitcher } = useRole();
  const router = useRouter();

  if (!canUseSwitcher) return null;

  const handleSwitch = (role: ContextSwitchRole) => {
    setActiveRole(role);
    router.push('/dashboard');
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low p-1',
        className,
      )}
      role="group"
      aria-label="Switch account mode"
    >
      {switchableRoles.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => handleSwitch(role)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition',
            activeRole === role
              ? 'bg-primary-container text-on-surface'
              : 'text-secondary hover:text-on-surface',
          )}
        >
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}
