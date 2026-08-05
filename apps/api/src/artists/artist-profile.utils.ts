import type { ArtistProfile } from '@prisma/client';

function portfolioCount(links: unknown): number {
  if (!links) return 0;
  if (Array.isArray(links)) return links.length;
  return 1;
}

/** 0–100 score used by the profile wizard and matching priority. */
export function calculateProfileCompletion(profile: ArtistProfile): number {
  const isBand = profile.artist_type === 'band';
  const checks = [
    !!profile.display_name?.trim(),
    !!profile.bio?.trim(),
    !!profile.city?.trim(),
    (profile.genres?.length ?? 0) > 0,
    (profile.travel_options?.length ?? 0) > 0 ||
      (profile.technical_rider?.length ?? 0) > 0 ||
      profile.provides_sound_system ||
      profile.needs_transport,
    portfolioCount(profile.portfolio_links) > 0,
    (profile.languages?.length ?? 0) > 0,
    isBand ? !!profile.band_name?.trim() : (profile.instruments?.length ?? 0) > 0,
    !!profile.profile_photo_url?.trim(),
    (profile.performance_types?.length ?? 0) > 0,
  ];
  const weights = [10, 10, 10, 15, 10, 10, 5, 10, 5, 5];
  return checks.reduce((acc, ok, i) => acc + (ok ? weights[i] : 0), 0);
}

export function isProfileComplete(score: number): boolean {
  return score >= 80;
}

type PublicArtistOmitKeys =
  | 'pricing_min'
  | 'pricing_max'
  | 'google_calendar_access_token'
  | 'google_calendar_refresh_token'
  | 'google_calendar_token_expiry';

/**
 * Strips fields that must never reach a browse/search/matches response:
 * - pricing_min/pricing_max — artist pay stays fully private and negotiated
 *   per booking, never disclosed upfront; the artist decides case by case
 *   whether to accept, through the booking-request offer thread.
 * - google_calendar_* — OAuth tokens; `browse`/`findOne` are public,
 *   unauthenticated endpoints, so these must never be serialized into a
 *   profile response at all (only used server-side for calendar sync).
 */
export function toPublicArtistProfile<T extends Record<PublicArtistOmitKeys, unknown>>(
  profile: T,
): Omit<T, PublicArtistOmitKeys> {
  const {
    pricing_min,
    pricing_max,
    google_calendar_access_token,
    google_calendar_refresh_token,
    google_calendar_token_expiry,
    ...rest
  } = profile;
  return rest;
}
