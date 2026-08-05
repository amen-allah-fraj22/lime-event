'use client';

import { useState, useEffect } from 'react';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

type RequestBookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  artistUserId: string;
  /** Optional — shown in the header/subtitle and message prompt for context. */
  artistName?: string;
};

type EventSummary = {
  id: string;
  title: string;
  event_date: string;
};

const NEW_EVENT_VALUE = '__new__';

export function RequestBookingModal({
  isOpen,
  onClose,
  artistUserId,
  artistName,
}: RequestBookingModalProps) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [message, setMessage] = useState('');

  // Inline creation state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    // Reset per-open state so a previous request doesn't linger visually.
    setError(null);
    setMessage('');
    setSelectedEventId('');
    setIsCreatingNew(false);
    setNewTitle('');
    setNewDate('');
    setLoading(true);
    api
      .get('/events/mine')
      .then((res) => {
        const evts = res.data as EventSummary[];
        setEvents(evts);
        if (evts.length > 0) {
          setSelectedEventId(evts[0].id);
        } else {
          setIsCreatingNew(true);
        }
      })
      .catch((err) => {
        setError(getApiErrorMessage(err).message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let finalEventId = selectedEventId;

      // 1. Create event if needed
      if (isCreatingNew) {
        if (!newTitle || !newDate) {
          throw new Error('Please provide a title and date for the new event.');
        }
        const evRes = await api.post('/events', {
          title: newTitle,
          event_date: new Date(newDate).toISOString(),
          event_type: 'other', // default
        });
        finalEventId = evRes.data.id;
      }

      // 2. Create Booking Request
      await api.post('/booking-requests', {
        event_id: finalEventId,
        artist_id: artistUserId,
        message,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : getApiErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  const todayIso = new Date().toISOString().split('T')[0];
  const selectValue = isCreatingNew ? NEW_EVENT_VALUE : selectedEventId;
  const messagePlaceholder = artistName
    ? `Hi ${artistName}! We're organizing an event and think you'd be a great fit. Let us know your availability, rate, and anything you need from us.`
    : "Hi! We're organizing an event and think you'd be a great fit. Let us know your availability, rate, and anything you need from us.";

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} labelledBy="request-booking-title">
      <div className="flex items-center justify-between border-b border-outline-variant p-5">
        <div>
          <h2 id="request-booking-title" className="font-headline text-xl font-bold">
            Request Booking
          </h2>
          <p className="mt-0.5 text-sm text-secondary">
            {artistName ? (
              <>
                Sending a request to <span className="font-semibold text-on-surface">{artistName}</span>
              </>
            ) : (
              'Tell the artist about your event'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-secondary hover:bg-surface-container hover:text-on-surface"
        >
          <MaterialIcon name="close" size={22} />
        </button>
      </div>

      {loading ? (
        <div className="py-16">
          <LoadingBlock label="Loading your events…" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {error && <ErrorAlert message={error} />}

            {events.length > 0 && (
              <div>
                <label
                  htmlFor="request-event-select"
                  className="mb-2 flex items-center gap-1.5 font-label-md font-bold text-on-surface"
                >
                  <MaterialIcon name="event" size={18} className="text-secondary" />
                  Which event is this for?
                </label>
                <div className="relative">
                  <select
                    id="request-event-select"
                    className="lime-input w-full appearance-none pr-9"
                    value={selectValue}
                    onChange={(e) => {
                      if (e.target.value === NEW_EVENT_VALUE) {
                        setIsCreatingNew(true);
                      } else {
                        setIsCreatingNew(false);
                        setSelectedEventId(e.target.value);
                      }
                    }}
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} · {new Date(ev.event_date).toLocaleDateString()}
                      </option>
                    ))}
                    <option value={NEW_EVENT_VALUE}>+ Create a new event</option>
                  </select>
                  <MaterialIcon
                    name="expand_more"
                    size={20}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                  />
                </div>
              </div>
            )}

            {isCreatingNew && (
              <div className="rounded-xl border border-primary-container bg-primary-container/10 p-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-primary">
                  <MaterialIcon name="auto_awesome" size={16} filled />
                  New event details
                </h3>
                <p className="mb-4 text-xs text-secondary">
                  We&apos;ll set this up so you can track it from your dashboard afterward.
                </p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label htmlFor="request-new-title" className="mb-1 block text-sm font-semibold">
                      Event title
                    </label>
                    <input
                      id="request-new-title"
                      required={isCreatingNew}
                      type="text"
                      placeholder="e.g. Amina & Karim's Wedding"
                      className="lime-input w-full"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="request-new-date" className="mb-1 block text-sm font-semibold">
                      Date
                    </label>
                    <input
                      id="request-new-date"
                      required={isCreatingNew}
                      type="date"
                      min={todayIso}
                      className="lime-input w-full"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="request-message"
                className="mb-1 flex items-center gap-1.5 font-label-md font-bold text-on-surface"
              >
                <MaterialIcon name="chat_bubble" size={18} className="text-secondary" />
                Message {artistName ? `to ${artistName}` : 'to artist'}
              </label>
              <p className="mb-2 text-xs text-secondary">
                Mention the venue, expected duration, and your budget — it helps them send an
                accurate quote faster.
              </p>
              <textarea
                id="request-message"
                rows={4}
                required
                maxLength={1000}
                className="lime-input w-full resize-none"
                placeholder={messagePlaceholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="mt-1 text-right text-[11px] text-secondary">{message.length}/1000</p>
            </div>
          </div>

          <div className="border-t border-outline-variant p-5">
            <button
              type="submit"
              disabled={submitting}
              className="lime-btn-primary flex w-full items-center justify-center gap-2 py-3 font-label-lg font-bold disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <MaterialIcon name="progress_activity" size={20} className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send Request
                  <MaterialIcon name="send" size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </ModalOverlay>
  );
}
