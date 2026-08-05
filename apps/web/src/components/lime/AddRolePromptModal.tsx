'use client';

import { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { useDbUser } from '@/components/providers/UserSessionProvider';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invalidateMeCache } from '@/lib/me-session';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import { normalizeRoles, type ContextSwitchRole } from '@/lib/roles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRoleAdded: () => void;
  /** Role to add when the user is in the other talent mode (artist ↔ organizer). */
  targetRole?: ContextSwitchRole;
}

const COPY: Record<
  ContextSwitchRole,
  { emoji: string; title: string; body: string; cta: string }
> = {
  organizer: {
    emoji: '🎪',
    title: 'Want to book this artist?',
    body: "You're currently in Artist mode. To book artists and create events, you need Organizer access — you can have both on the same account, for free.",
    cta: 'Add Organizer Access — Free',
  },
  artist: {
    emoji: '🎤',
    title: 'Want to perform as an artist?',
    body: "You're currently in Organizer mode. To manage your artist profile and receive bookings, add Artist access — you can have both on the same account, for free.",
    cta: 'Add Artist Access — Free',
  },
};

export function AddRolePromptModal({
  isOpen,
  onClose,
  onRoleAdded,
  targetRole = 'organizer',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setActiveRole, setRoles } = useRole();
  const { refreshUser } = useDbUser();
  const copy = COPY[targetRole];

  async function handleAddRole() {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.patch('/users/me/add-role', { role: targetRole });
      const roles = normalizeRoles(updated.data.roles ?? []);
      setRoles(roles);
      setActiveRole(targetRole);
      invalidateMeCache();
      await refreshUser();
      onRoleAdded();
    } catch (err) {
      setError(getApiErrorMessage(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} labelledBy="add-role-title">
      <div className="overflow-y-auto p-6 text-center sm:p-8">
        <p className="text-4xl" aria-hidden>
          {copy.emoji}
        </p>
        <h2 id="add-role-title" className="mt-4 font-headline text-xl font-bold text-on-surface">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">{copy.body}</p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleAddRole}
          disabled={loading}
          className="lime-btn-primary mt-6 w-full disabled:opacity-60"
        >
          {loading ? 'Activating…' : copy.cta}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-full border border-outline-variant px-4 py-3 text-sm text-secondary hover:bg-surface-container"
        >
          Maybe later
        </button>
      </div>
    </ModalOverlay>
  );
}
