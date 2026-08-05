'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

type OrganizerEvent = {
  id: string;
  title: string;
  city?: string | null;
  event_date: string;
  booking_requests?: { artist_id: string; status: string }[];
};

function formatEventLabel(event: OrganizerEvent): string {
  const date = new Date(event.event_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const place = event.city?.trim() || 'Tunisia';
  const title = event.title?.trim() || 'Untitled event';
  return `${title} · ${place} · ${date}`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  artistUserId: string;
  artistName: string;
}

export function SendBookingRequestModal({
  isOpen,
  onClose,
  artistUserId,
  artistName,
}: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventId, setEventId] = useState('');
  const [message, setMessage] = useState(
    `Hi ${artistName}, I'd love to have you perform at my event.`,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ available: boolean; warning?: string; reason?: string } | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const availableEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          !e.booking_requests?.some(
            (br) => br.artist_id === artistUserId && br.status !== 'declined',
          ),
      ),
    [events, artistUserId],
  );

  useEffect(() => {
    if (!isOpen) return;
    setSuccess(false);
    setBookingId(null);
    setError(null);
    setMessage(`Hi ${artistName}, I'd love to have you perform at my event.`);
    setLoadingEvents(true);
    api
      .get('/events/mine')
      .then((res) => {
        const list = res.data as OrganizerEvent[];
        setEvents(list);
        const eligible = list.filter(
          (e) =>
            !e.booking_requests?.some(
              (br) => br.artist_id === artistUserId && br.status !== 'declined',
            ),
        );
        setEventId(eligible[0]?.id ?? '');
      })
      .catch((err) => setError(getApiErrorMessage(err).message))
      .finally(() => setLoadingEvents(false));
  }, [isOpen, artistUserId, artistName]);

  const selectedEvent = useMemo(() => events.find((e) => e.id === eventId), [events, eventId]);

  useEffect(() => {
    if (!selectedEvent || !isOpen) {
      setAvailability(null);
      return;
    }
    setCheckingAvailability(true);
    api.get(`/artists/${artistUserId}/availability?date=${selectedEvent.event_date.split('T')[0]}`)
      .then((res) => setAvailability(res.data))
      .catch((err) => console.error('Failed to check availability', err))
      .finally(() => setCheckingAvailability(false));
  }, [selectedEvent, isOpen, artistUserId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId) {
      setError('Please select an event.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/booking-requests', {
        event_id: eventId,
        artist_id: artistUserId,
        message: message.trim() || undefined,
      });
      setBookingId(res.data.id as string);
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="booking-request-title"
    >
      <div className="overflow-y-auto overscroll-contain p-6 sm:p-8">
        {success ? (
          <div className="text-center">
            <p className="text-4xl" aria-hidden>
              ✓
            </p>
            <h2
              id="booking-request-title"
              className="mt-4 font-headline text-xl font-bold text-on-surface"
            >
              Request sent!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              Your booking request to <strong>{artistName}</strong> is pending. The artist
              will be notified and can accept or send a quote.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {bookingId && (
                <button
                  type="button"
                  onClick={() => router.push(`/bookings/${bookingId}`)}
                  className="lime-btn-primary w-full"
                >
                  View booking
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push('/dashboard/bookings')}
                className="lime-btn-outline w-full"
              >
                Go to dashboard
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-secondary hover:text-primary"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2
              id="booking-request-title"
              className="font-headline text-xl font-bold text-on-surface"
            >
              Send booking request
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Choose an event to invite <strong>{artistName}</strong> to perform.
            </p>

            {loadingEvents ? (
              <p className="mt-6 text-sm text-secondary">Loading your events…</p>
            ) : events.length === 0 ? (
              <div className="mt-6 space-y-4 text-sm text-secondary">
                <p>You don&apos;t have any events yet. Create one first, then send a request.</p>
                <Link href="/events/new" className="lime-btn-primary block w-full text-center">
                  Create event
                </Link>
                <button type="button" onClick={onClose} className="w-full text-secondary">
                  Cancel
                </button>
              </div>
            ) : availableEvents.length === 0 ? (
              <div className="mt-6 space-y-4 text-sm text-secondary">
                <p>
                  You already have an active request to this artist for each of your events.
                  Create a new event or check your dashboard.
                </p>
                <Link
                  href="/dashboard/bookings"
                  className="lime-btn-primary block w-full text-center"
                >
                  View bookings
                </Link>
                <button type="button" onClick={onClose} className="w-full text-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="booking-event-select"
                    className="text-xs font-semibold uppercase text-brand-accent"
                  >
                    Your event
                  </label>
                  <select
                    id="booking-event-select"
                    className="lime-input mt-1 w-full"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    required
                  >
                    {availableEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {formatEventLabel(ev)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="booking-message"
                    className="text-xs font-semibold uppercase text-brand-accent"
                  >
                    Message (optional)
                  </label>
                  <textarea
                    id="booking-message"
                    className="lime-input mt-1 min-h-[88px] w-full"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the artist about your event…"
                  />
                </div>
                {availability && !availability.available && availability.reason === 'artist_blocked' && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                    <p className="font-bold">Date Unavailable</p>
                    <p>This artist is fully booked or unavailable on this date.</p>
                  </div>
                )}
                {availability && availability.available && availability.warning === 'artist_busy' && (
                  <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                    <p className="font-bold">Limited Availability</p>
                    <p>This artist already has an event on this date. You can still send a request, but they might be busy.</p>
                  </div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || !eventId || checkingAvailability || Boolean(availability && !availability.available)}
                  className="lime-btn-primary w-full disabled:opacity-60"
                >
                  {checkingAvailability ? 'Checking availability…' : submitting ? 'Sending…' : 'Send request'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full text-sm text-secondary hover:text-on-surface"
                >
                  Cancel
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </ModalOverlay>
  );
}
