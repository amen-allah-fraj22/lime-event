'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

type PublicEvent = {
  id: string;
  title: string;
  event_date: string;
  city?: string;
  budget_min?: number;
  budget_max?: number;
  style_tags: string[];
  venue_photo_url?: string | null;
  organizer: { id: string; first_name: string; last_name: string };
};

export default function ExploreEventsRoute() {
  const router = useRouter();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply State: one-tap apply by default; "Add a note" reveals an optional
  // inline field per-card instead of blocking every application on a modal.
  const [noteOpenFor, setNoteOpenFor] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/events')
      .then((res) => setEvents(res.data))
      .catch((err) => setError(getApiErrorMessage(err).message))
      .finally(() => setLoading(false));
  }, []);

  async function handleApply(event: PublicEvent) {
    setSubmittingId(event.id);
    try {
      // Fetch the currently logged-in user's artist profile ID
      const meRes = await api.get('/auth/me');
      const artistId = meRes.data.artist_profile?.id;
      if (!artistId) throw new Error("You must complete your artist profile to apply.");

      const res = await api.post('/booking-requests', {
        event_id: event.id,
        artist_id: artistId,
        message: notes[event.id] || undefined,
      });

      router.push(`/bookings/${res.data.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : getApiErrorMessage(err).message);
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 text-center md:text-left">
          <h1 className="font-headline text-3xl font-bold">Explore Events</h1>
          <p className="mt-2 text-sm text-secondary">
            Find public events looking for artists and apply to perform.
          </p>
        </header>

        {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {loading ? (
          <div className="py-12 text-center text-secondary">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-secondary">No public events currently available.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <div key={ev.id} className="lime-card flex flex-col overflow-hidden p-6 transition-transform hover:-translate-y-1 hover:shadow-lg">
                {ev.venue_photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.venue_photo_url}
                    alt={ev.title}
                    className="-mx-6 -mt-6 mb-4 h-36 w-[calc(100%+3rem)] object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-headline text-xl font-bold">{ev.title}</h3>
                  <p className="text-sm text-brand-accent mb-2">
                    {new Date(ev.event_date).toLocaleDateString()} • {ev.city || 'Location TBD'}
                  </p>
                  
                  {(ev.budget_min || ev.budget_max) && (
                    <p className="text-sm font-semibold text-primary mb-4">
                      Budget: {ev.budget_min || 0} - {ev.budget_max || 'Flexible'} TND
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-6">
                    {ev.style_tags.map((tag) => (
                      <span key={tag} className="lime-chip text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {noteOpenFor === ev.id && (
                  <textarea
                    rows={3}
                    autoFocus
                    className="mb-3 w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-3 text-sm"
                    placeholder="Add a note for the organizer (optional)…"
                    value={notes[ev.id] || ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                  />
                )}

                <div className="mt-auto flex flex-col gap-2">
                  <button
                    onClick={() => handleApply(ev)}
                    disabled={submittingId === ev.id}
                    className="lime-btn-primary w-full py-2 text-sm font-bold disabled:opacity-50"
                  >
                    {submittingId === ev.id ? 'Applying…' : 'Apply to Perform'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteOpenFor(noteOpenFor === ev.id ? null : ev.id)}
                    className="text-xs font-semibold text-secondary hover:text-primary"
                  >
                    {noteOpenFor === ev.id ? 'Hide note' : 'Add a note (optional)'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
