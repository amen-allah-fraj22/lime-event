'use client';

import { useEffect, useState } from 'react';
import { useRole } from '@/context/RoleContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface PublicEvent {
  id: string;
  title: string;
  event_type: string;
  city?: string;
  venue?: string;
  event_date: string;
  start_time?: string;
  duration_hours?: number;
  budget_min?: number;
  budget_max?: number;
  style_tags: string[];
  status: string;
  organizer?: { id: string; email: string };
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: 'favorite',
  corporate: 'business',
  festival: 'celebration',
  private: 'lock',
  club: 'nightlife',
  other: 'event',
};

export function ExploreEventsPage() {
  const { activeRole } = useRole();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Use existing events endpoint for now — in Phase 2 we'll add GET /events/public
    api
      .get('/events/mine', { skipGlobalError: true })
      .then((res: any) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setEvents(data);
      })
      .catch(() => {
        setError('Could not load events. Try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSendInterest = async (eventId: string) => {
    setSendingId(eventId);
    try {
      // Placeholder — will use POST /booking-requests with artist-initiated flow in Phase 2
      await new Promise((r) => setTimeout(r, 800));
      setSentIds((prev) => new Set(prev).add(eventId));
    } catch {
      // handled
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-TN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mx-auto max-w-container-max px-4 py-6 md:px-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-headline-md text-brand-text">
          Explore Events
        </h1>
        <p className="mt-1 text-sm text-brand-accent">
          Discover events matching your profile and show your interest
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="lime-card animate-pulse p-5">
              <div className="mb-3 h-5 w-3/4 rounded bg-surface-container" />
              <div className="mb-2 h-4 w-1/2 rounded bg-surface-container" />
              <div className="mb-4 h-4 w-2/3 rounded bg-surface-container" />
              <div className="h-10 w-full rounded-lg bg-surface-container" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl border border-error-container bg-error-container/30 p-6 text-center">
          <span className="material-symbols-outlined mb-2 text-3xl text-error">error</span>
          <p className="text-sm font-medium text-error">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="lime-btn-primary mt-4 px-6 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-6xl text-surface-container-high">
            event_busy
          </span>
          <h3 className="font-headline text-lg font-semibold text-brand-text">
            No events available yet
          </h3>
          <p className="mt-2 max-w-sm text-sm text-brand-accent">
            New events will appear here as organizers publish them. Check back soon!
          </p>
        </div>
      )}

      {/* Event cards grid */}
      {!loading && !error && events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const sent = sentIds.has(event.id);
            const sending = sendingId === event.id;
            const icon = EVENT_TYPE_ICONS[event.event_type] || 'event';

            return (
              <div
                key={event.id}
                className="lime-card overflow-hidden transition-all hover:shadow-float"
              >
                {/* Type badge header */}
                <div className="flex items-center gap-2 border-b border-surface-variant bg-surface-container-low px-4 py-2.5">
                  <span className="material-symbols-outlined text-[18px] text-lime-dark">
                    {icon}
                  </span>
                  <span className="text-label-sm font-semibold capitalize text-brand-text">
                    {event.event_type}
                  </span>
                </div>

                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-headline text-base font-bold text-brand-text line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Date & Location */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-brand-accent">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {formatDate(event.event_date)}
                    </div>
                    {event.city && (
                      <div className="flex items-center gap-1.5 text-sm text-brand-accent">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {event.city}{event.venue ? ` — ${event.venue}` : ''}
                      </div>
                    )}
                  </div>

                  {/* Budget */}
                  {(event.budget_min || event.budget_max) && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-lime-dark">
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      {event.budget_min && event.budget_max
                        ? `${event.budget_min} — ${event.budget_max} TND`
                        : event.budget_max
                        ? `Up to ${event.budget_max} TND`
                        : `From ${event.budget_min} TND`}
                    </div>
                  )}

                  {/* Style tags */}
                  {event.style_tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {event.style_tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="lime-chip text-[11px]">
                          {tag}
                        </span>
                      ))}
                      {event.style_tags.length > 3 && (
                        <span className="lime-chip text-[11px] opacity-60">
                          +{event.style_tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <button
                    onClick={() => !sent && handleSendInterest(event.id)}
                    disabled={sent || sending}
                    className={cn(
                      'mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
                      sent
                        ? 'bg-lime/20 text-lime-dark cursor-default'
                        : 'lime-btn-primary',
                    )}
                  >
                    {sending ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending…
                      </>
                    ) : sent ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Interest sent
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        I&apos;m interested
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
