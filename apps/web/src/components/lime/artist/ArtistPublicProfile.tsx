'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { SendBookingRequestButton } from '@/components/lime/SendBookingRequestButton';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  getArtistAvatarUrl,
  getArtistCoverUrl,
  getPortfolioThumbnailUrl,
} from '@/lib/artist-profile-media';
import { parsePortfolioLinks } from '@/lib/portfolio-links';
import { cn } from '@/lib/utils';

import { ArtistWhatsIncluded } from '@/components/lime/artist/ArtistWhatsIncluded';
import { ArtistBookingSidebar } from '@/components/lime/artist/ArtistBookingSidebar';
import { ArtistStickyBookingBar } from '@/components/lime/artist/ArtistStickyBookingBar';
import type { ArtistProfileFull } from '@/lib/artist-profile-types';
import { parseBandMembers } from '@/lib/artist-profile-types';

type TabId = 'about' | 'portfolio' | 'reviews';

const TABS: { id: TabId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'reviews', label: 'Reviews' },
];

function splitBio(bio: string): { lead: string; rest?: string } {
  const paragraphs = bio.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 2) {
    return { lead: paragraphs[0], rest: paragraphs.slice(1).join('\n\n') };
  }
  const sentences = bio.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length >= 2) {
    const mid = Math.ceil(sentences.length / 2);
    return {
      lead: sentences.slice(0, mid).join(' ').trim(),
      rest: sentences.slice(mid).join(' ').trim(),
    };
  }
  return { lead: bio };
}

function StarRating({ score, className }: { score: number; className?: string }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = score >= i;
    const half = !filled && score >= i - 0.5;
    stars.push(
      <MaterialIcon
        key={i}
        name={filled ? 'star' : half ? 'star_half' : 'star'}
        size={22}
        filled={filled || half}
        className={cn('text-primary-container', className)}
      />,
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function BookingCta({
  profileId,
  artistUserId,
  artistName,
  isOwner,
  isSignedIn,
}: {
  profileId: string;
  artistUserId?: string;
  artistName: string;
  isOwner: boolean;
  isSignedIn: boolean;
}) {
  if (isOwner) {
    return (
      <Link
        href={`/artists/${profileId}/edit`}
        className="artist-btn-primary w-full md:w-auto"
      >
        <MaterialIcon name="edit" size={20} />
        Edit profile
      </Link>
    );
  }
  if (isSignedIn && artistUserId) {
    return (
      <SendBookingRequestButton
        artistUserId={artistUserId}
        artistName={artistName}
        signInRedirectPath={`/artists/${profileId}`}
        label="Send Booking Request"
      />
    );
  }
  return (
    <Link
      href={`/sign-in?redirect_url=${encodeURIComponent(`/artists/${profileId}`)}`}
      className="artist-btn-primary w-full md:w-auto"
    >
      <MaterialIcon name="calendar_add_on" size={20} />
      Sign in to book
    </Link>
  );
}

function AccountActions() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await api.delete('/users/me');
      await signOut(() => router.push('/'));
    } catch (err) {
      setError(getApiErrorMessage(err).message);
      setDeleting(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-surface-variant pt-3">
      <button
        type="button"
        onClick={() => signOut(() => router.push('/'))}
        className="flex items-center gap-2 text-sm font-semibold text-secondary hover:text-on-surface"
      >
        <MaterialIcon name="logout" size={18} />
        Log out
      </button>

      {!confirmingDelete ? (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="flex items-center gap-2 text-sm font-semibold text-error hover:underline"
        >
          <MaterialIcon name="delete" size={18} />
          Delete account
        </button>
      ) : (
        <div className="rounded-lg border border-error/30 bg-error/5 p-3">
          <p className="text-sm font-semibold text-error">
            Permanently delete your account and profile? This can&apos;t be undone.
          </p>
          {error && <p className="mt-2 text-xs text-error">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="rounded-lg bg-error px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Yes, delete it'}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ArtistPublicProfile({
  artist,
  isSignedIn,
  isOwner,
}: {
  artist: ArtistProfileFull;
  isSignedIn: boolean;
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<TabId>('about');
  const coverUrl = artist.cover_photo_url || getArtistCoverUrl(artist.id);
  const avatarUrl = artist.profile_photo_url || getArtistAvatarUrl(artist.id);
  const bandMembers = parseBandMembers(artist.band_members);
  const isBand = artist.artist_type === 'band';
  const portfolio = useMemo(
    () => parsePortfolioLinks(artist.portfolio_links),
    [artist.portfolio_links],
  );
  const bioParts = splitBio(
    artist.bio?.trim() ||
      `${artist.display_name} is a professional artist on LIME Event. Book them for weddings, corporate events, and private celebrations across Tunisia.`,
  );
  const reviewCountLabel =
    artist.total_bookings > 0
      ? `${artist.total_bookings} completed event${artist.total_bookings === 1 ? '' : 's'}`
      : 'New on LIME';

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* Hero */}
      <section className="relative mx-auto mb-12 mt-4 w-full max-w-container-max overflow-visible px-margin-mobile md:mt-8 md:px-margin-desktop">
        <div className="relative h-[250px] w-full overflow-hidden md:h-[400px] md:rounded-xl">
          {artist.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image
              src={coverUrl}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 1280px"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="artist-glass-card -mt-20 mx-0 flex flex-col items-start gap-6 overflow-visible p-6 md:-mt-32 md:mx-12 md:p-8">
          <div className="relative -mt-16 shrink-0 self-center md:-mt-24 md:self-auto">
            <div className="relative h-32 w-32 overflow-hidden rounded-xl border-4 border-surface shadow-lg md:h-48 md:w-48">
              {artist.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={artist.display_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={avatarUrl}
                  alt={artist.display_name}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              )}
            </div>
            {artist.user?.is_verified && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-primary-container px-2 py-1 font-label-sm text-on-primary-container shadow-md">
                <MaterialIcon name="verified" size={14} filled />
                PRO
              </div>
            )}
          </div>

          <div className="w-full min-w-0 flex-1">
            <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
              <div className="min-w-0 flex-1">
                <h1 className="m-0 break-words font-headline text-headline-lg font-bold md:text-headline-xl">
                  {artist.display_name}
                </h1>
                <div className="mt-2 flex items-start gap-2 text-sm text-secondary sm:text-base">
                  <MaterialIcon name="location_on" size={18} className="mt-0.5 shrink-0" />
                  <span className="break-words">
                    {artist.city ? `${artist.city}, Tunisia` : 'Tunisia'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      isBand
                        ? 'bg-on-surface text-primary-container'
                        : 'bg-lime/25 text-on-surface',
                    )}
                  >
                    {isBand
                      ? `Band${artist.band_size ? ` · ${artist.band_size} members` : ''}`
                      : 'Solo artist'}
                  </span>
                  {(artist.languages ?? []).map((lang) => (
                    <span key={lang} className="text-xs text-secondary">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div className="w-full shrink-0 lg:w-auto lg:min-w-[200px] lg:max-w-[280px]">
                <BookingCta
                  profileId={artist.id}
                  artistUserId={artist.user?.id}
                  artistName={artist.display_name}
                  isOwner={isOwner}
                  isSignedIn={isSignedIn}
                />
                {isOwner && <AccountActions />}
              </div>
            </div>
            {artist.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {artist.genres.map((g) => (
                  <span key={g} className="artist-profile-chip">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-30 border-b border-surface-variant bg-surface">
        <div className="mx-auto flex max-w-container-max gap-8 overflow-x-auto px-margin-mobile md:px-margin-desktop">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'whitespace-nowrap py-4 font-label-md transition-colors',
                tab === t.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-secondary hover:text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels + sticky booking sidebar */}
      <div
        className={cn(
          'mx-auto mb-24 flex max-w-container-max flex-col gap-gutter px-margin-mobile py-8 md:px-margin-desktop lg:flex-row lg:items-start',
          !isOwner && 'pb-28 lg:pb-0',
        )}
      >
      <div className="min-h-[400px] min-w-0 flex-1">
        {tab === 'about' && (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            <div className="space-y-8 md:col-span-2">
              <section className="rounded-2xl bg-surface-container-lowest p-8 shadow-card">
                <h2 className="mb-4 font-headline text-headline-md text-on-surface">
                  Biography
                </h2>
                <p className="mb-4 font-body-lg leading-relaxed text-on-surface-variant">
                  {bioParts.lead}
                </p>
                {bioParts.rest && (
                  <p className="font-body-md leading-relaxed text-secondary">
                    {bioParts.rest}
                  </p>
                )}
              </section>

              <ArtistWhatsIncluded profile={artist as unknown as Record<string, unknown>} />

              {!isBand && (artist.instruments?.length ?? 0) > 0 && (
                <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-card">
                  <h3 className="mb-3 font-headline text-lg font-bold">Instruments</h3>
                  <div className="flex flex-wrap gap-2">
                    {artist.instruments!.map((inst) => (
                      <span key={inst} className="artist-profile-chip">
                        {inst}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {isBand && bandMembers.length > 0 && (
                <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-card">
                  <h3 className="mb-3 font-headline text-lg font-bold">Band members</h3>
                  <div className="flex flex-wrap gap-2">
                    {bandMembers.map((m, i) => (
                      <span
                        key={`${m.name}-${i}`}
                        className="rounded-lg border border-surface-variant bg-surface-container-low px-3 py-2 text-sm"
                      >
                        <strong>{m.name || 'Member'}</strong>
                        {m.role ? ` · ${m.role}` : ''}
                        {m.instrument ? ` · ${m.instrument}` : ''}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-card">
                <h3 className="mb-4 font-label-md uppercase tracking-widest text-secondary">
                  Quick Stats
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-center justify-between border-b border-surface-variant pb-2">
                    <span className="font-body-md text-on-surface-variant">
                      Rating
                    </span>
                    <span className="font-label-md text-on-surface">
                      ★ {artist.avg_rating.toFixed(1)}
                    </span>
                  </li>
                  {artist.years_experience != null && artist.years_experience > 0 && (
                    <li className="flex items-center justify-between border-b border-surface-variant pb-2">
                      <span className="font-body-md text-on-surface-variant">Experience</span>
                      <span className="font-label-md text-on-surface">
                        {artist.years_experience} years
                      </span>
                    </li>
                  )}
                  {(artist.setlist_duration_min || artist.setlist_duration_max) && (
                    <li className="flex items-center justify-between border-b border-surface-variant pb-2">
                      <span className="font-body-md text-on-surface-variant">Set duration</span>
                      <span className="font-label-md text-on-surface">
                        {artist.setlist_duration_min ?? '?'}–{artist.setlist_duration_max ?? '?'} min
                      </span>
                    </li>
                  )}
                  <li className="flex items-center justify-between border-b border-surface-variant pb-2">
                    <span className="font-body-md text-on-surface-variant">
                      Events completed
                    </span>
                    <span className="font-label-md text-on-surface">
                      {artist.total_bookings > 0
                        ? `${artist.total_bookings}+`
                        : '—'}
                    </span>
                  </li>
                  <li className="flex items-center justify-between pb-2">
                    <span className="font-body-md text-on-surface-variant">
                      Response
                    </span>
                    <span className="font-label-md text-primary">~24 hours</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === 'portfolio' && (
          <div className="space-y-12">
            {artist.demo_track_url && (
              <a
                href={artist.demo_track_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-primary-container bg-lime/10 p-4 transition hover:bg-lime/20"
              >
                <MaterialIcon name="play_circle" size={40} className="text-primary" />
                <div>
                  <p className="font-semibold">Featured demo</p>
                  <p className="text-sm text-secondary">Listen to a highlight performance</p>
                </div>
              </a>
            )}
            <h2 className="font-headline text-headline-md text-on-surface">
              Latest mixes &amp; performances
            </h2>
            {portfolio.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-surface-variant bg-surface-container-lowest p-12 text-center">
                <MaterialIcon
                  name="library_music"
                  size={48}
                  className="mx-auto text-secondary"
                />
                <p className="mt-4 font-body-md text-secondary">
                  No portfolio links yet. The artist can add SoundCloud, YouTube, or
                  other links when editing their profile.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {portfolio.map((item, index) => {
                  const thumb =
                    item.thumbnail ?? getPortfolioThumbnailUrl(artist.id, index);
                  const inner = (
                    <>
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/20" />
                      <MaterialIcon
                        name="play_circle"
                        size={64}
                        className="relative z-10 text-white drop-shadow-lg transition-transform group-hover:scale-110"
                      />
                      <div className="absolute bottom-4 left-4 z-10 text-white">
                        {item.platform && (
                          <p className="font-label-sm uppercase opacity-80">
                            {item.platform}
                          </p>
                        )}
                        <p className="font-headline text-headline-md">{item.title}</p>
                      </div>
                    </>
                  );
                  const className =
                    'group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-card';
                  return item.url ? (
                    <a
                      key={`${item.title}-${index}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={`${item.title}-${index}`} className={className}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <h2 className="font-headline text-headline-md text-on-surface">
                Client reviews
              </h2>
              <StarRating score={artist.avg_rating} />
              <span className="font-label-md text-secondary">
                {artist.avg_rating.toFixed(1)} · {reviewCountLabel}
              </span>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-card">
              <p className="font-body-md italic text-on-surface">
                {artist.total_bookings > 0
                  ? 'Detailed client reviews will appear here as organizers complete events and leave feedback.'
                  : 'No reviews yet — be the first to book this artist on LIME Event.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {!isOwner && (
        <ArtistBookingSidebar
          artist={artist}
          bookingSlot={
            <BookingCta
              profileId={artist.id}
              artistUserId={artist.user?.id}
              artistName={artist.display_name}
              isOwner={isOwner}
              isSignedIn={isSignedIn}
            />
          }
        />
      )}
      </div>

      {!isOwner && (
        <ArtistStickyBookingBar
          artist={artist}
          bookingSlot={
            <BookingCta
              profileId={artist.id}
              artistUserId={artist.user?.id}
              artistName={artist.display_name}
              isOwner={isOwner}
              isSignedIn={isSignedIn}
            />
          }
        />
      )}

      {/* Footer strip (Stitch) */}
      <footer className="mx-auto grid max-w-container-max grid-cols-1 gap-gutter border-t border-outline-variant px-margin-mobile py-12 md:grid-cols-2 md:px-margin-desktop">
        <div>
          <p className="mb-2 flex items-center gap-2 font-headline text-headline-md font-bold text-primary">
            <MaterialIcon name="sunny" filled />
            LIME
          </p>
          <p className="font-body-md text-primary">
            © {new Date().getFullYear()} LIME Marketplace. Tunisians talented together.
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 font-label-sm text-on-surface-variant md:flex-row md:items-center md:justify-end md:gap-8">
          <Link href="/" className="transition-colors hover:text-primary hover:underline">
            Home
          </Link>
          <Link href="/explore/artists" className="transition-colors hover:text-primary hover:underline">
            Browse artists
          </Link>
          <Link
            href="/sign-up"
            className="transition-colors hover:text-primary hover:underline"
          >
            Join LIME
          </Link>
        </div>
      </footer>
    </div>
  );
}
