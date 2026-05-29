'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/Logo';
import api from '@/lib/api';
import type { ActiveRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

const ROLES: { id: ActiveRole; label: string; desc: string }[] = [
  { id: 'artist', label: 'Artist', desc: 'Receive booking requests and send quotes' },
  { id: 'organizer', label: 'Organizer', desc: 'Create events and book talent' },
  { id: 'agency', label: 'Agency', desc: 'Manage multiple artists' },
];

export default function OnboardingRolePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<ActiveRole[]>(['organizer']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(role: ActiveRole) {
    setSelectedRoles((prev) => {
      if (role === 'agency') {
        return prev.includes('agency') ? [] : ['agency'];
      }
      const withoutAgency = prev.filter((r) => r !== 'agency');
      if (withoutAgency.includes(role)) {
        const next = withoutAgency.filter((r) => r !== role);
        return next.length ? next : withoutAgency;
      }
      return [...withoutAgency, role];
    });
  }

  async function complete() {
    if (!user || selectedRoles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await user.update({
        unsafeMetadata: { role: selectedRoles[0], roles: selectedRoles },
      });
      const token = await getToken();
      if (token) {
        await api.post(
          '/auth/sync',
          {
            email: user.primaryEmailAddress?.emailAddress,
            roles: selectedRoles,
            clerk_user_id: user.id,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save roles');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <Logo className="mb-8 h-10 w-auto" />
      <div className="lime-card w-full max-w-lg p-8">
        <h1 className="font-headline text-2xl font-bold">Choose your roles</h1>
        <p className="mt-2 text-sm text-brand-accent">
          Select all that apply. Artist and Organizer can share one account and switch modes;
          Agency is a separate account type.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const selected = selectedRoles.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRole(r.id)}
                className={cn(
                  'rounded-full border-2 px-5 py-2 text-sm font-semibold capitalize transition',
                  selected
                    ? 'border-lime-container bg-lime/20 text-on-surface'
                    : 'border-surface-variant text-secondary hover:border-lime/50',
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-brand-accent">
          {ROLES.filter((r) => selectedRoles.includes(r.id)).map((r) => (
            <li key={r.id}>
              <span className="font-semibold text-on-surface">{r.label}:</span> {r.desc}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-secondary">
          Musicians who also plan events? Choose both Artist and Organizer (not with Agency).
        </p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={complete}
          disabled={loading || selectedRoles.length === 0}
          className="lime-btn-primary mt-6 w-full disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Continue to dashboard'}
        </button>
      </div>
    </div>
  );
}
