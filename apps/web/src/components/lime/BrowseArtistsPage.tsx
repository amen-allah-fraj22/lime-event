'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilterCombobox } from '@/components/ui/FilterCombobox';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  BROWSE_CITY_OPTIONS,
  TUNISIAN_GENRE_OPTIONS,
  mergeGenreOptions,
} from '@/lib/browse-filter-options';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { getArtistCoverUrl } from '@/lib/artist-profile-media';
import { cn } from '@/lib/utils';

export type ArtistCardData = {
  id: string;
  display_name: string;
  city?: string | null;
  genres: string[];
  avg_rating: number;
  profile_photo_url?: string | null;
  cover_photo_url?: string | null;
  user?: { id: string };
};

export type BrowseFilters = {
  genre: string;
  city: string;
  artist_type: string;
  has_sound: boolean;
  has_lighting: boolean;
  has_mixing: boolean;
};

const DEFAULT_FILTERS: BrowseFilters = {
  genre: '',
  city: '',
  artist_type: '',
  has_sound: false,
  has_lighting: false,
  has_mixing: false,
};

function ArtistCardSkeleton() {
  return (
    <div className="lime-card overflow-hidden">
      <div className="h-24 shimmer sm:h-36" />
      <div className="space-y-2 p-3 sm:space-y-3 sm:p-5">
        <div className="h-4 w-2/3 rounded shimmer sm:h-5" />
        <div className="h-3 w-1/2 rounded shimmer sm:h-4" />
        <div className="flex gap-1.5 sm:gap-2">
          <div className="h-5 w-12 rounded-full shimmer sm:h-6 sm:w-14" />
          <div className="h-5 w-14 rounded-full shimmer sm:h-6 sm:w-16" />
        </div>
        <div className="h-3 w-3/4 rounded shimmer sm:h-4" />
        <div className="flex gap-2 pt-1">
          <div className="h-8 flex-1 rounded-lg shimmer sm:h-9" />
        </div>
      </div>
    </div>
  );
}

function filterArtistsClient(
  artists: ArtistCardData[],
  filters: BrowseFilters,
): ArtistCardData[] {
  const city = filters.city.trim().toLowerCase();
  const genre = filters.genre.trim().toLowerCase();
  return artists.filter((a) => {
    if (city && !(a.city ?? '').toLowerCase().includes(city)) return false;
    if (genre && !a.genres.some((g) => g.toLowerCase().includes(genre))) return false;
    return true;
  });
}

type BrowseArtistsPageProps = {
  onSendRequest?: (artistUserId: string, artist: ArtistCardData) => void;
  /** Preloaded list (e.g. event matches) — filters run locally, no /artists API. */
  staticArtists?: ArtistCardData[];
  staticLoading?: boolean;
  resultsTitle?: string;
  resultsSubtitle?: string;
};

export default function BrowseArtistsPage({
  onSendRequest,
  staticArtists,
  staticLoading = false,
  resultsTitle = 'Browse artists',
  resultsSubtitle,
}: BrowseArtistsPageProps) {
  const isStaticMode = staticArtists !== undefined;
  const [draftFilters, setDraftFilters] = useState<BrowseFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [artists, setArtists] = useState<ArtistCardData[]>([]);
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const debouncedGenre = useDebouncedValue(draftFilters.genre, 450);
  const debouncedCity = useDebouncedValue(draftFilters.city, 450);

  const appliedFilters = useMemo(
    () => ({
      genre: debouncedGenre,
      city: debouncedCity,
      artist_type: draftFilters.artist_type,
      has_sound: draftFilters.has_sound,
      has_lighting: draftFilters.has_lighting,
      has_mixing: draftFilters.has_mixing,
    }),
    [
      debouncedGenre,
      debouncedCity,
      draftFilters.artist_type,
      draftFilters.has_sound,
      draftFilters.has_lighting,
      draftFilters.has_mixing,
    ],
  );

  const isFiltering =
    draftFilters.genre !== debouncedGenre || draftFilters.city !== debouncedCity;

  const fetchArtists = useCallback(async (filters: BrowseFilters) => {
    setLoadingResults(true);
    setError(null);
    try {
      const res = await api.get('/artists', {
        params: {
          genre: filters.genre.trim() || undefined,
          city: filters.city.trim() || undefined,
          artist_type: filters.artist_type || undefined,
          has_sound: filters.has_sound ? 'true' : undefined,
          has_lighting: filters.has_lighting ? 'true' : undefined,
          has_mixing: filters.has_mixing ? 'true' : undefined,
        },
      });
      const data = res.data as ArtistCardData[];
      setArtists(data);
      const fromProfiles = data.flatMap((a) => a.genres ?? []);
      setGenreOptions((prev) => mergeGenreOptions([...prev, ...fromProfiles]));
    } catch (e) {
      setError(getApiErrorMessage(e).message);
      setArtists([]);
    } finally {
      setLoadingResults(false);
      setHasLoadedOnce(true);
    }
  }, []);

  useEffect(() => {
    if (isStaticMode) {
      const fromProfiles = (staticArtists ?? []).flatMap((a) => a.genres ?? []);
      setGenreOptions((prev) => mergeGenreOptions([...prev, ...fromProfiles]));
      setHasLoadedOnce(true);
      return;
    }
    void fetchArtists(appliedFilters);
  }, [appliedFilters, fetchArtists, isStaticMode, staticArtists]);

  const displayedArtists = useMemo(() => {
    if (!isStaticMode) return artists;
    return filterArtistsClient(staticArtists ?? [], appliedFilters);
  }, [isStaticMode, staticArtists, artists, appliedFilters]);

  const resultsLoading = isStaticMode ? staticLoading : loadingResults;

  const cityOptions = BROWSE_CITY_OPTIONS;
  const allGenreOptions = useMemo(
    () => mergeGenreOptions(genreOptions),
    [genreOptions],
  );

  function clearFilters() {
    setDraftFilters(DEFAULT_FILTERS);
  }

  const activeFilterCount = [
    draftFilters.city,
    draftFilters.genre,
    draftFilters.artist_type,
    draftFilters.has_sound || draftFilters.has_lighting || draftFilters.has_mixing,
  ].filter(Boolean).length;

  function renderFilterFields() {
    return (
      <>
        <FilterCombobox
          label="City"
          placeholder="Search or pick a city…"
          value={draftFilters.city}
          options={cityOptions}
          onChange={(city) => setDraftFilters((f) => ({ ...f, city }))}
          emptyHint="No city matches — check spelling"
        />

        <div>
          <FilterCombobox
            label="Genre"
            placeholder="Search, pick, or type your own…"
            value={draftFilters.genre}
            options={allGenreOptions}
            onChange={(genre) => setDraftFilters((f) => ({ ...f, genre }))}
            emptyHint="No match — press Enter to search that genre anyway"
            allowOther
            otherLabel="Other — type any genre above"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="pt-1 text-[11px] font-semibold uppercase text-brand-accent">
              Popular in Tunisia:
            </span>
            {TUNISIAN_GENRE_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() =>
                  setDraftFilters((f) => ({ ...f, genre: f.genre === g ? '' : g }))
                }
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  draftFilters.genre === g
                    ? 'border-primary-container bg-primary-container'
                    : 'border-surface-variant bg-white hover:bg-surface-container-low',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-brand-accent">Artist type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { value: '', label: 'All' },
              { value: 'solo', label: 'Solo' },
              { value: 'band', label: 'Band' },
            ].map((opt) => (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => setDraftFilters((f) => ({ ...f, artist_type: opt.value }))}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold',
                  draftFilters.artist_type === opt.value
                    ? 'border-primary-container bg-primary-container'
                    : 'border-surface-variant bg-white',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-brand-accent">Brings equipment</p>
          <div className="mt-2 space-y-2">
            {(
              [
                ['has_sound', 'Sound system'],
                ['has_lighting', 'Lighting'],
                ['has_mixing', 'Mixing desk'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draftFilters[key]}
                  onChange={(e) =>
                    setDraftFilters((f) => ({ ...f, [key]: e.target.checked }))
                  }
                  className="accent-lime-container"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:px-8">
      {/* Mobile filter trigger — opens the filters as a popup */}
      <div className="md:hidden">
        <button
          type="button"
          data-testid="mobile-filter-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
          className="lime-btn-outline flex w-full items-center justify-center gap-2 py-3 text-sm font-bold"
        >
          <MaterialIcon name="tune" size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-container px-1.5 text-xs font-bold text-brand-text">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile filters popup */}
      <ModalOverlay
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        labelledBy="artist-filters-title"
        panelClassName="md:hidden"
      >
        <div className="flex items-center justify-between border-b border-surface-variant p-4">
          <h2 id="artist-filters-title" className="font-headline text-lg font-bold">
            Filters
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-xs font-semibold uppercase text-brand-accent hover:text-primary"
              onClick={clearFilters}
            >
              Clear all
            </button>
            <button
              type="button"
              aria-label="Close filters"
              className="rounded-full p-1.5 text-secondary hover:bg-surface-container hover:text-on-surface"
              onClick={() => setFiltersOpen(false)}
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-4">{renderFilterFields()}</div>
        <div className="border-t border-surface-variant p-4">
          <button
            type="button"
            className="lime-btn-primary w-full py-3 text-sm font-bold"
            onClick={() => setFiltersOpen(false)}
          >
            Show {isStaticMode ? filterArtistsClient(staticArtists ?? [], appliedFilters).length : artists.length} results
          </button>
        </div>
      </ModalOverlay>

      {/* Sidebar — sticky on desktop, hidden on mobile (popup is used instead) */}
      <aside className="hidden w-full shrink-0 space-y-6 rounded-xl border border-surface-variant bg-white p-6 shadow-card md:sticky md:top-20 md:block md:w-72">
        <div className="flex items-center justify-between border-b border-surface-variant pb-4">
          <h2 className="font-headline text-lg font-bold">Filters</h2>
          <button
            type="button"
            className="text-xs font-semibold uppercase text-brand-accent hover:text-primary"
            onClick={clearFilters}
          >
            Clear all
          </button>
        </div>

        {renderFilterFields()}

        <p className="text-xs text-secondary">
          Results update shortly after you pause typing. Pick from the list for best matches.
        </p>
      </aside>

      {/* Results — only this section refreshes */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-headline text-2xl font-bold md:text-3xl">{resultsTitle}</h1>
            <p className="mt-1 text-sm text-brand-accent">
              {resultsSubtitle ??
                (resultsLoading && hasLoadedOnce
                  ? 'Updating results…'
                  : `${displayedArtists.length} artist${displayedArtists.length === 1 ? '' : 's'} found`)}
            </p>
          </div>
          {(isFiltering || resultsLoading) && hasLoadedOnce && !isStaticMode && (
            <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-secondary">
              Filtering…
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4">
            <ErrorAlert
              title="Could not load artists"
              message={error}
              onRetry={() => void fetchArtists(appliedFilters)}
            />
          </div>
        )}

        <div
          className={cn(
            'mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3',
            resultsLoading && 'opacity-60 transition-opacity',
          )}
          aria-busy={resultsLoading}
        >
          {resultsLoading && !hasLoadedOnce
            ? Array.from({ length: 6 }).map((_, i) => <ArtistCardSkeleton key={i} />)
            : displayedArtists.map((artist) => (
                <article
                  key={artist.id}
                  data-testid="artist-card"
                  className="lime-card flex h-full flex-col overflow-hidden transition hover:scale-[1.01]"
                >
                  <div className="relative h-24 overflow-hidden bg-gradient-to-br from-lime/30 to-surface-container sm:h-36">
                    {/* Real cover photo when uploaded, otherwise a deterministic
                        placeholder; the gradient shows through if both fail. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artist.cover_photo_url || getArtistCoverUrl(artist.id)}
                      alt={artist.display_name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col space-y-1.5 p-3 sm:space-y-3 sm:p-5">
                    <div>
                      <h3 className="truncate font-headline text-sm font-bold sm:text-lg">
                        {artist.display_name}
                      </h3>
                      <p className="truncate text-xs text-brand-accent sm:text-sm">
                        {artist.city ?? 'Tunisia'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {artist.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="lime-chip truncate px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-brand-accent sm:text-sm">
                      ★ {artist.avg_rating.toFixed(1)}
                    </p>
                    <div className="mt-auto flex gap-1.5 pt-1 sm:gap-2">
                      <Link
                        href={`/artists/${artist.id}`}
                        className={cn(
                          'lime-btn-outline flex-1 whitespace-nowrap px-1 py-1.5 text-center text-[11px] sm:px-6 sm:py-2 sm:text-sm',
                        )}
                      >
                        <span className="sm:hidden">Profile</span>
                        <span className="hidden sm:inline">View profile</span>
                      </Link>
                      {onSendRequest && (
                        <button
                          type="button"
                          className="lime-btn-primary flex-1 px-1 py-1.5 text-[11px] sm:px-6 sm:py-2 sm:text-sm"
                          onClick={() => onSendRequest(artist.user?.id ?? artist.id, artist)}
                        >
                          Request
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
        </div>

        {!resultsLoading && !error && displayedArtists.length === 0 && (
          <p className="mt-8 text-center text-brand-accent">
            No artists match these filters. Try clearing city or genre.
          </p>
        )}
      </div>
    </div>
  );
}
