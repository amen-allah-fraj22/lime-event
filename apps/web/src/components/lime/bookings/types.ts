export type BookingDetail = {
  id: string;
  status: string;
  message?: string | null;
  quote_amount?: number | null;
  agreed_fee?: number | null;
  quote_expires_at?: string | null;
  quote_conditions?: Record<string, unknown> | null;
  created_at: string;
  event: {
    id: string;
    title: string;
    event_type: string;
    event_date: string;
    city?: string | null;
    venue?: string | null;
    start_time?: string | null;
    duration_hours?: number | null;
    guest_count?: number | null;
    budget_min?: number | null;
    budget_max?: number | null;
  };
  artist: {
    id: string;
    artist_profile?: import('@/lib/artist-profile-types').ArtistProfileFull | null;
  };
  organizer: { id: string; email: string };
  contract?: { id: string; status: string } | null;
  messages: {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    message_type?: string | null;
  }[];
  negotiation_offers?: {
    id: string;
    proposed_by: string;
    fee: number;
    status: string;
    created_at: string;
  }[];
};
