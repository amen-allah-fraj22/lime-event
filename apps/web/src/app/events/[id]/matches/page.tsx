'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import BrowseArtistsPage, { type ArtistCardData } from '@/components/lime/BrowseArtistsPage';
import { RequestBookingModal } from '@/components/lime/artists/RequestBookingModal';
import api from '@/lib/api';

export default function EventMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [artists, setArtists] = useState<ArtistCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/events/${id}/matches`)
      .then((res) => setArtists(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AppShell>
      <div className="border-b border-surface-variant bg-white px-4 py-3">
        <p className="text-center text-sm text-brand-accent">
          Matched artists for your event (filter-based, random order)
        </p>
      </div>
      <BrowseArtistsPage
        staticArtists={artists}
        staticLoading={loading}
        resultsTitle="Matched artists"
        resultsSubtitle="Filtered by your event — adjust sidebar to narrow results"
        onSendRequest={(artistId, artist) => setRequest({ id: artistId, name: artist.display_name })}
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
