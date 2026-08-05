import { BookingStatus } from '@prisma/client';
import {
  artistHasResponded,
  shouldMoveToNegotiating,
} from './booking-timeline.util';

describe('booking-timeline.util', () => {
  describe('shouldMoveToNegotiating', () => {
    it('moves to negotiating only when artist messages on pending', () => {
      expect(
        shouldMoveToNegotiating(BookingStatus.pending, 'artist-1', 'artist-1'),
      ).toBe(true);
      expect(
        shouldMoveToNegotiating(BookingStatus.pending, 'org-1', 'artist-1'),
      ).toBe(false);
      expect(
        shouldMoveToNegotiating(BookingStatus.negotiating, 'artist-1', 'artist-1'),
      ).toBe(false);
    });
  });

  describe('artistHasResponded', () => {
    const artistId = 'artist-1';

    it('is false when only organizer messaged', () => {
      expect(
        artistHasResponded(
          artistId,
          [{ sender_id: 'org-1', message_type: 'text' }],
          [],
        ),
      ).toBe(false);
    });

    it('is true when artist sent a message', () => {
      expect(
        artistHasResponded(
          artistId,
          [{ sender_id: artistId, message_type: 'text' }],
          [],
        ),
      ).toBe(true);
    });

    it('is true when artist sent an offer', () => {
      expect(
        artistHasResponded(artistId, [], [{ proposed_by: artistId }]),
      ).toBe(true);
    });

    it('ignores system messages from artist', () => {
      expect(
        artistHasResponded(
          artistId,
          [{ sender_id: artistId, message_type: 'system' }],
          [],
        ),
      ).toBe(false);
    });
  });
});
