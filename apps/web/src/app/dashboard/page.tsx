'use client';

import { ArtistDashboard } from '@/components/lime/dashboard/ArtistDashboard';
import { OrganizerDashboard } from '@/components/lime/dashboard/OrganizerDashboard';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { useDbUser } from '@/components/providers/UserSessionProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  // Read the DB user's active_role directly rather than RoleContext's
  // activeRole: RoleProvider applies a freshly-loaded dbUser through its own
  // effect, which lags one render cycle behind dbUser itself arriving here —
  // gating on activeRole flash-redirects fresh artist sessions to
  // /explore/artists on a hard page load, before it catches up.
  //
  // Separately, the very first /users/me fetch on a hard reload sometimes
  // 401s before the API client's token getter finishes registering, then a
  // second automatic retry inside UserSessionProvider succeeds — so a null
  // dbUser right after loading finishes isn't necessarily "not an artist",
  // it can just be that transient failure. Only redirect once we have a
  // confirmed (non-null) dbUser to read a role from; otherwise keep waiting.
  const { user: dbUser, loading: sessionLoading } = useDbUser();
  const isArtist = dbUser?.active_role === 'artist';

  const router = useRouter();

  useEffect(() => {
    if (sessionLoading || !dbUser) return;
    if (!isArtist) {
      router.replace('/explore/artists');
    }
  }, [sessionLoading, dbUser, isArtist, router]);

  if (!sessionLoading && isArtist) {
    return <ArtistDashboard />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <LoadingBlock label="Redirecting…" />
    </div>
  );
}
