'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type ArtistCardData = {
  id: string;
  display_name: string;
  city?: string | null;
  genres: string[];
  pricing_min?: number | null;
  pricing_max?: number | null;
  avg_rating: number;
  user?: { id: string };
};

type BrowseArtistsPageProps = {
  artists: ArtistCardData[];
  filters: { genre: string; city: string; priceMin: number; priceMax: number };
  onFilterChange: (filters: BrowseArtistsPageProps['filters']) => void;
  onSendRequest?: (artistUserId: string) => void;
  emptyHint?: string;
};

export default function BrowseArtistsPage({
  artists,
  filters,
  onFilterChange,
  onSendRequest,
  emptyHint = 'No artists found. Add profiles via Prisma Studio or wait for sign-ups.',
}: BrowseArtistsPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
      <aside className="w-full shrink-0 space-y-6 rounded-xl border border-surface-variant bg-white p-6 shadow-card md:w-72">
        <div className="flex items-center justify-between border-b border-surface-variant pb-4">
          <h2 className="font-headline text-lg font-bold">Filters</h2>
          <button
            type="button"
            className="text-xs font-semibold uppercase text-brand-accent hover:text-primary"
            onClick={() =>
              onFilterChange({ genre: '', city: '', priceMin: 0, priceMax: 5000 })
            }
          >
            Clear all
          </button>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-brand-accent">City</label>
          <input
            className="lime-input mt-2"
            placeholder="Tunis, Sousse…"
            value={filters.city}
            onChange={(e) => onFilterChange({ ...filters, city: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-brand-accent">Genre</label>
          <input
            className="lime-input mt-2"
            placeholder="jazz, dj…"
            value={filters.genre}
            onChange={(e) => onFilterChange({ ...filters, genre: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-brand-accent">
            Max price (TND)
          </label>
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            className="mt-3 w-full accent-lime-container"
            value={filters.priceMax}
            onChange={(e) =>
              onFilterChange({ ...filters, priceMax: Number(e.target.value) })
            }
          />
          <p className="mt-1 text-sm text-brand-accent">Up to {filters.priceMax} TND</p>
        </div>
      </aside>

      <div className="flex-1">
        <h1 className="font-headline text-2xl font-bold md:text-3xl">Browse artists</h1>
        <p className="mt-1 text-sm text-brand-accent">
          Filter by genre, city, and budget — Phase 1 matching uses rules only.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {artists.map((artist) => (
            <article
              key={artist.id}
              data-testid="artist-card"
              className="lime-card overflow-hidden transition hover:scale-[1.01]"
            >
              <div className="h-36 bg-gradient-to-br from-lime/30 to-surface-container" />
              <div className="space-y-3 p-5">
                <div>
                  <h3 className="font-headline text-lg font-bold">{artist.display_name}</h3>
                  <p className="text-sm text-brand-accent">{artist.city ?? 'Tunisia'}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {artist.genres.slice(0, 3).map((g) => (
                    <span key={g} className="lime-chip">
                      {g}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium">
                  {artist.pricing_min ?? '—'} – {artist.pricing_max ?? '—'} TND
                  <span className="ml-2 text-brand-accent">
                    ★ {artist.avg_rating.toFixed(1)}
                  </span>
                </p>
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/artists/${artist.id}`}
                    className={cn('lime-btn-outline flex-1 text-center text-sm py-2')}
                  >
                    View profile
                  </Link>
                  {onSendRequest && (
                    <button
                      type="button"
                      className="lime-btn-primary flex-1 text-sm py-2"
                      onClick={() => onSendRequest(artist.user?.id ?? artist.id)}
                    >
                      Request
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        {artists.length === 0 && (
          <p className="mt-8 text-center text-brand-accent">{emptyHint}</p>
        )}
      </div>
    </div>
  );
}
