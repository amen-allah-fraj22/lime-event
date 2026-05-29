'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import BrowseArtistsPage, { type ArtistCardData } from '@/components/lime/BrowseArtistsPage';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistCardData[]>([]);
  const [filters, setFilters] = useState({
    genre: '',
    city: '',
    priceMin: 0,
    priceMax: 5000,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/artists', {
        params: {
          genre: filters.genre || undefined,
          city: filters.city || undefined,
          priceMax: filters.priceMax || undefined,
        },
      });
      setArtists(res.data);
    } catch (e) {
      const info = getApiErrorMessage(e);
      setError(info.message);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      {error && (
        <div className="mx-auto max-w-container-max px-4 pt-4">
          <ErrorAlert title="Could not load artists" message={error} onRetry={load} />
        </div>
      )}
      {loading ? (
        <LoadingBlock label="Loading artists…" />
      ) : (
        <BrowseArtistsPage
          artists={artists}
          filters={filters}
          onFilterChange={setFilters}
          emptyHint={
            error
              ? undefined
              : 'No artists in the database. Run: npm run db:seed from the project root.'
          }
        />
      )}
    </AppShell>
  );
}
