import { BookingStatus } from '@prisma/client';

export function artistHasResponded(
  artistId: string,
  messages: { sender_id: string; message_type: string | null }[],
  offers: { proposed_by: string }[],
): boolean {
  const artistMessaged = messages.some(
    (m) => m.sender_id === artistId && m.message_type !== 'system',
  );
  const artistOffered = offers.some((o) => o.proposed_by === artistId);
  return artistMessaged || artistOffered;
}

/** Only the artist's first reply moves a pending request into negotiation. */
export function shouldMoveToNegotiating(
  status: BookingStatus,
  senderId: string,
  artistId: string,
): boolean {
  return status === BookingStatus.pending && senderId === artistId;
}
