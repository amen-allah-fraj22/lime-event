export type BandMember = { name: string; role: string; instrument: string };

export type PortfolioLinkItem = { type: string; url: string; label?: string };

export type ArtistProfileFull = {
  id: string;
  display_name: string;
  bio?: string | null;
  city?: string | null;
  languages?: string[];
  profile_photo_url?: string | null;
  cover_photo_url?: string | null;
  artist_type?: string;
  instruments?: string[];
  years_experience?: number | null;
  performance_style?: string | null;
  band_name?: string | null;
  band_size?: number | null;
  band_members?: BandMember[] | null;
  has_sound_system?: boolean;
  has_lighting?: boolean;
  setup_time_minutes?: number | null;
  genres: string[];
  subgenres?: string[];
  performance_types?: string[];
  setlist_duration_min?: number | null;
  setlist_duration_max?: number | null;
  pricing_notes?: string | null;
  travel_options?: string[];
  travel_other?: string | null;
  travel_surcharge?: boolean;
  travel_radius_km?: number | null;
  portfolio_links?: PortfolioLinkItem[] | unknown;
  demo_track_url?: string | null;
  technical_rider?: string[] | string | null;
  technical_other?: string | null;
  hospitality_rider?: string[] | string | null;
  hospitality_other?: string | null;
  provides_sound_system?: boolean;
  provides_mixing_desk?: boolean;
  provides_lighting?: boolean;
  provides_microphones?: boolean;
  provides_instruments?: boolean;
  provides_stage_backdrop?: boolean;
  provides_own_transport?: boolean;
  equipment_notes?: string | null;
  needs_transport?: boolean;
  needs_accommodation?: boolean;
  needs_meals?: boolean;
  needs_drinks?: boolean;
  needs_stage_crew?: boolean;
  needs_parking?: boolean;
  needs_dressing_room?: boolean;
  needs_sound_engineer?: boolean;
  requirements_notes?: string | null;
  min_event_duration_hrs?: number | null;
  max_event_duration_hrs?: number | null;
  max_events_per_month?: number | null;
  avg_rating: number;
  total_bookings: number;
  is_profile_complete?: boolean;
  profile_completion?: number;
  user?: { id: string; is_verified?: boolean };
};

export function parseBandMembers(raw: unknown): BandMember[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      if (!m || typeof m !== 'object') return null;
      const o = m as Record<string, unknown>;
      return {
        name: String(o.name ?? ''),
        role: String(o.role ?? ''),
        instrument: String(o.instrument ?? ''),
      };
    })
    .filter((m): m is BandMember => m !== null);
}
