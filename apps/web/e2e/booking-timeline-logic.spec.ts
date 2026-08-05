import { test, expect } from '@playwright/test';
import {
  artistHasResponded,
  bookingStatusLabel,
  computeBookingTimelineStep,
} from '../src/lib/booking-timeline';

const ARTIST = 'artist-uuid';
const ORG = 'org-uuid';

test.describe('Booking timeline logic', () => {
  test('organizer message alone stays at step 1 even if status is negotiating (legacy)', () => {
    const step = computeBookingTimelineStep({
      status: 'negotiating',
      artistId: ARTIST,
      messages: [{ sender_id: ORG, message_type: 'text' }],
      offers: [],
    });
    expect(step).toBe(1);
    expect(artistHasResponded(ARTIST, [{ sender_id: ORG, message_type: 'text' }], [])).toBe(
      false,
    );
  });

  test('artist message advances to step 2', () => {
    const messages = [
      { sender_id: ORG, message_type: 'text' },
      { sender_id: ARTIST, message_type: 'text' },
    ];
    expect(computeBookingTimelineStep({ status: 'negotiating', artistId: ARTIST, messages })).toBe(
      2,
    );
    expect(bookingStatusLabel('negotiating', ARTIST, messages, [])).toBe('In conversation');
  });

  test('pending + organizer only shows awaiting artist', () => {
    expect(
      bookingStatusLabel('pending', ARTIST, [{ sender_id: ORG, message_type: 'text' }], []),
    ).toBe('Awaiting artist');
    expect(
      computeBookingTimelineStep({
        status: 'pending',
        artistId: ARTIST,
        messages: [{ sender_id: ORG, message_type: 'text' }],
      }),
    ).toBe(1);
  });

  test('any offer moves to step 3', () => {
    expect(
      computeBookingTimelineStep({
        status: 'quoted',
        artistId: ARTIST,
        messages: [],
        offers: [{ proposed_by: ORG }],
      }),
    ).toBe(3);
  });

  test('accepted status is step 4', () => {
    expect(
      computeBookingTimelineStep({ status: 'accepted', artistId: ARTIST, messages: [], offers: [] }),
    ).toBe(4);
  });
});
