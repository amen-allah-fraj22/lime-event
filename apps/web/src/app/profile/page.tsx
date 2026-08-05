'use client';

import { useAuth, useClerk, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { ensureDatabaseUser } from '@/lib/auth-sync';

/**
 * /profile — role-aware profile page
 * - Artist → redirects to their artist profile view/edit
 * - Organizer → shows simple account page
 */
export default function ProfilePage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { activeRole } = useRole();
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut(() => router.push('/'));
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    if (activeRole === 'artist') {
      // Redirect artist to their profile page
      ensureDatabaseUser(user, getToken)
        .then((me) => {
          const profile = me.artist_profile as
            | { id: string; is_profile_complete?: boolean }
            | null
            | undefined;
          if (profile?.id) {
            router.replace(`/artists/${profile.id}`);
          } else {
            router.replace('/onboarding/role');
          }
        })
        .catch(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [isLoaded, isSignedIn, user, activeRole, getToken, router]);

  if (!isLoaded || (activeRole === 'artist' && !ready)) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingBlock label="Loading profile…" />
        </div>
      </AppShell>
    );
  }

  // Organizer profile — simple account view
  return (
    <AppShell>
      <div className="mx-auto max-w-container-max px-4 py-6 md:px-10">
        <h1 className="font-headline text-headline-md text-brand-text">My Account</h1>
        <p className="mt-1 text-sm text-brand-accent">
          Manage your account settings
        </p>

        <div className="mt-6 space-y-4">
          {/* User info card */}
          <div className="lime-card overflow-hidden p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime/20 ring-2 ring-lime/40">
                {user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[30px] text-lime-dark">person</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-headline text-lg font-bold text-brand-text">
                  {user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'User'}
                </h3>
                <p className="truncate text-sm text-brand-accent">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                <span className="mt-1.5 inline-block rounded-full bg-lime/20 px-3 py-0.5 text-[11px] font-semibold capitalize text-lime-dark">
                  {activeRole}
                </span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="lime-card divide-y divide-surface-variant">
            <ProfileLink
              icon="event"
              label="My Events"
              description="View and manage your published events"
              onClick={() => router.push('/events/mine')}
            />
            <ProfileLink
              icon="notifications"
              label="Notifications"
              description="View your notification preferences"
              onClick={() => router.push('/notifications')}
            />
            <ProfileLink
              icon="history"
              label="Booking History"
              description="Review past bookings and contracts"
              onClick={() => router.push('/requests')}
            />
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="lime-card flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-error/5 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[22px] text-error">logout</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-error">
                {signingOut ? 'Signing out…' : 'Log Out'}
              </p>
              <p className="text-[12px] text-brand-accent">End your session on this device</p>
            </div>
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function ProfileLink({
  icon,
  label,
  description,
  onClick,
}: {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-container-low"
    >
      <span className="material-symbols-outlined text-[22px] text-brand-accent">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-brand-text">{label}</p>
        <p className="text-[12px] text-brand-accent">{description}</p>
      </div>
      <span className="material-symbols-outlined text-[18px] text-surface-variant">
        chevron_right
      </span>
    </button>
  );
}
