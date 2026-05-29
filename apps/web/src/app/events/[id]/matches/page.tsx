'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import BrowseArtistsPage, { type ArtistCardData } from '@/components/lime/BrowseArtistsPage';
import api from '@/lib/api';

export default function EventMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [artists, setArtists] = useState<ArtistCardData[]>([]);
  const [filters, setFilters] = useState({ genre: '', city: '', priceMin: 0, priceMax: 5000 });

  useEffect(() => {
    if (!id) return;
    api.get(`/events/${id}/matches`).then((res) => setArtists(res.data)).catch(console.error);
  }, [id]);

  async function sendRequest(artistUserId: string) {
    if (!id) return;
    const res = await api.post('/booking-requests', {
      event_id: id,
      artist_id: artistUserId,
      message: 'Interested in performing at my event.',
    });
    router.push(`/bookings/${res.data.id}`);
  }

  return (
    <AppShell>
      <div className="border-b border-surface-variant bg-white px-4 py-3">
        <p className="text-center text-sm text-brand-accent">
          Matched artists for your event (filter-based, random order)
        </p>
      </div>
      <BrowseArtistsPage
        artists={artists}
        filters={filters}
        onFilterChange={setFilters}
        onSendRequest={sendRequest}
      />
    </AppShell>
  );
}
