'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import BrowseArtistsPage from '@/components/lime/BrowseArtistsPage';
import { RequestBookingModal } from '@/components/lime/artists/RequestBookingModal';

export default function ExploreArtistsRoute() {
  const [request, setRequest] = useState<{ id: string; name: string } | null>(null);

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
