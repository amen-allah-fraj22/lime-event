'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { ArtistProfileWizard } from '@/components/lime/wizard/ArtistProfileWizard';
import { ensureDatabaseUser } from '@/lib/auth-sync';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function ArtistEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(`/artists/${id}/edit`)}`);
      return;
    }
    if (!id || !user) return;

    let cancelled = false;
    (async () => {
      setPageLoading(true);
      setError(null);
      try {
        const me = await ensureDatabaseUser(user, getToken);
        const myProfileId = me.artist_profile?.id as string | undefined;
        if (!myProfileId || myProfileId !== id) {
          if (!cancelled) {
            setError('You can only edit your own artist profile.');
            setAuthorized(false);
          }
          return;
        }
        if (!cancelled) setAuthorized(true);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err).message);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, id, isLoaded, isSignedIn, router, user]);

  if (!isLoaded || pageLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingBlock label="Loading…" />
        </div>
      </AppShell>
    );
  }

  if (!authorized) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-sm text-red-600">{error ?? 'Access denied'}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ArtistProfileWizard profileId={id} />
    </AppShell>
  );
}
