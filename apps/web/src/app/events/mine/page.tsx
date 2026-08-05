'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface MyEvent {
  id: string;
  title: string;
  event_type: string;
  city?: string;
  venue?: string;
  event_date: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  style_tags: string[];
  _count?: { booking_requests?: number };
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: 'favorite',
  corporate: 'business',
  festival: 'celebration',
  private: 'lock',
  club: 'nightlife',
  other: 'event',
};

export default function MyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/events/mine', { skipGlobalError: true })
      .then((res: any) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setEvents(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-TN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-container-max px-4 py-6 md:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-headline-md text-brand-text">My Events</h1>
            <p className="mt-1 text-sm text-brand-accent">
              Events you&apos;ve created
            </p>
          </div>
          <button
            onClick={() => router.push('/events/new')}
            className="lime-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Event
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="lime-card animate-pulse p-5">
                <div className="h-5 w-2/3 rounded bg-surface-container" />
                <div className="mt-2 h-4 w-1/3 rounded bg-surface-container" />
                <div className="mt-3 h-4 w-1/2 rounded bg-surface-container" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && events.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-surface-container-high">
              event
            </span>
            <h3 className="font-headline text-lg font-semibold text-brand-text">
              No events yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-brand-accent">
              Create your first event to start finding artists for your occasion.
            </p>
            <button
              onClick={() => router.push('/events/new')}
              className="lime-btn-primary mt-6 px-6 py-3 text-sm"
            >
              Create Event
            </button>
          </div>
        )}

        {/* Event cards */}
        {!loading && events.length > 0 && (
          <div className="mt-6 space-y-3">
            {events.map((event) => {
              const icon = EVENT_TYPE_ICONS[event.event_type] || 'event';
              return (
                <button
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}/matches`)}
                  className="lime-card w-full p-5 text-left transition-all hover:shadow-float"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-lime/15">
                      <span className="material-symbols-outlined text-[22px] text-lime-dark">
                        {icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-headline text-base font-bold text-brand-text">
                        {event.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-brand-accent">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {formatDate(event.event_date)}
                        </span>
                        {event.city && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {event.city}
                          </span>
                        )}
                      </div>
                      {event.style_tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {event.style_tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="lime-chip text-[10px]">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-surface-variant">
                      chevron_right
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
