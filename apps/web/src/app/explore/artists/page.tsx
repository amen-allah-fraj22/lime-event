'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import BrowseArtistsPage from '@/components/lime/BrowseArtistsPage';
import { RequestBookingModal } from '@/components/lime/artists/RequestBookingModal';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { useDbUser } from '@/components/providers/UserSessionProvider';

// Soft-launch gate: while we're onboarding the first wave of artists, the
// roster is too thin to show organizers without hurting the campaign. Flip
// NEXT_PUBLIC_ARTIST_DIRECTORY_LIVE=true (env var + redeploy) once there's
// enough of a roster to be worth browsing — no code change needed then.
// Unset/anything else = hidden. Admins always see the real page, so it can
// still be QA'd while hidden from everyone else.
const DIRECTORY_LIVE = process.env.NEXT_PUBLIC_ARTIST_DIRECTORY_LIVE === 'true';

function ComingSoon() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <MaterialIcon name="auto_awesome" size={40} className="mx-auto mb-4 text-primary" />
      <h1 className="font-headline text-2xl font-bold">We&apos;re building our artist roster</h1>
      <p className="mt-3 text-secondary">
        We&apos;re onboarding artists right now — check back soon to browse verified talent.
        Already have an event to plan?{' '}
        <a href="mailto:contact@limeevent.com" className="text-primary underline">
          Get in touch
        </a>{' '}
        and we&apos;ll help you find the right match.
      </p>
    </div>
  );
}

export default function ExploreArtistsRoute() {
  const [request, setRequest] = useState<{ id: string; name: string } | null>(null);
  const { user: dbUser, loading } = useDbUser();
  const isAdmin = dbUser?.roles?.includes('admin');

  if (!DIRECTORY_LIVE) {
    if (loading) {
      return (
        <AppShell>
          <LoadingBlock label="Loading…" />
        </AppShell>
      );
    }
    if (!isAdmin) {
      return (
        <AppShell>
          <ComingSoon />
        </AppShell>
      );
    }
  }

  return (
    <AppShell>
      <BrowseArtistsPage
        onSendRequest={(id, artist) => setRequest({ id, name: artist.display_name })}
      />

      {request && (
        <RequestBookingModal
          isOpen={!!request}
          onClose={() => setRequest(null)}
          artistUserId={request.id}
          artistName={request.name}
        />
      )}
    </AppShell>
  );
}
