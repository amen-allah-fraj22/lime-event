'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { ensureDatabaseUser } from '@/lib/auth-sync';

export default function ArtistMePage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      router.replace('/sign-in?redirect_url=/artists/me');
      return;
    }

    ensureDatabaseUser(user, getToken)
      .then((me) => {
        const profile = me.artist_profile as
          | { id: string; is_profile_complete?: boolean }
          | null
          | undefined;
        if (profile?.id) {
          if (profile.is_profile_complete) {
            router.replace(`/artists/${profile.id}`);
          } else {
            router.replace(`/artists/${profile.id}/edit`);
          }
          return;
        }
        router.replace('/onboarding/role');
      })
      .catch(() => router.replace('/onboarding/role'));
  }, [getToken, isLoaded, isSignedIn, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <LoadingBlock label="Opening profile…" />
    </div>
  );
}
