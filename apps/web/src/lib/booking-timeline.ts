import { isBookingConfirmed } from '@/lib/artist-equipment-options';

export type TimelineMessage = {
  sender_id: string;
  message_type?: string | null;
};

export type TimelineOffer = {
  proposed_by: string;
};

/** True when the artist sent a chat message or an offer (not system-only). */
export function artistHasResponded(
  artistId: string,
  messages: TimelineMessage[] = [],
  offers: TimelineOffer[] = [],
): boolean {
  const artistMessaged = messages.some(
    (m) => m.sender_id === artistId && m.message_type !== 'system',
  );
  const artistOffered = offers.some((o) => o.proposed_by === artistId);
  return artistMessaged || artistOffered;
}

export function hasNegotiationOffer(offers: TimelineOffer[] = []): boolean {
  return offers.length > 0;
}

export function computeBookingTimelineStep(input: {
  status: string;
  artistId: string;
  messages?: TimelineMessage[];
  offers?: TimelineOffer[];
}): number {
  const { status, artistId, messages = [], offers = [] } = input;

  if (isBookingConfirmed(status)) return 4;
  if (status === 'quoted' || hasNegotiationOffer(offers)) return 3;
  if (artistHasResponded(artistId, messages, offers)) return 2;
  return 1;
}

/** Status pill — does not treat organizer-only chat as "in conversation". */
export function bookingStatusLabel(
  status: string,
  artistId: string,
  messages: TimelineMessage[] = [],
  offers: TimelineOffer[] = [],
): string {
  if (isBookingConfirmed(status)) return 'Confirmed';
  if (status === 'quoted' || hasNegotiationOffer(offers)) return 'Offer received';
  if (artistHasResponded(artistId, messages, offers)) return 'In conversation';
  if (status === 'pending' || status === 'negotiating') return 'Awaiting artist';
  if (status === 'declined') return 'Declined';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'expired') return 'Expired';
  return status.replace(/_/g, ' ');
}
