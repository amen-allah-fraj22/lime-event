'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import { useRole } from '@/context/RoleContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

type EventRow = {
  id: string;
  title: string;
  city?: string | null;
  venue?: string | null;
  event_date: string;
  status: string;
  booking_requests: { id: string; status: string }[];
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    accepted: 'bg-primary-container text-on-primary-fixed',
    contracted: 'bg-primary-container text-on-primary-fixed',
    completed: 'bg-primary-container text-on-primary-fixed',
    quoted: 'bg-tertiary-container text-on-tertiary-container',
    pending: 'bg-tertiary-container text-on-tertiary-container',
    open: 'bg-tertiary-container text-on-tertiary-container',
  };
  return map[status] ?? 'bg-surface-container text-secondary';
}

export default function DashboardEventsPage() {
  const { hasRole } = useRole();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/events/mine')
      .then((evRes) => setEvents(evRes.data))
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell
      title="My Events"
      subtitle="Manage and track all your posted events."
      showNewEvent={hasRole('organizer') || hasRole('agency')}
    >
      {loading && <LoadingBlock label="Loading events…" />}
      {error && <ErrorAlert title="Could not load events" message={error} />}
      {!loading && !error && (
        <div className="space-y-6">
          {events.length === 0 ? (
            <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-10 text-center">
              <p className="text-secondary">You have not created any events yet.</p>
              <Link href="/events/new" className="lime-btn-pill mt-6 inline-block text-sm">
                Create your first event
              </Link>
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="dashboard-shadow flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-headline text-title-md">{ev.title}</h3>
                  <p className="mt-1 text-body-md text-secondary">
                    {ev.city ?? '—'} · {new Date(ev.event_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-label-sm font-semibold capitalize ${statusBadge(ev.status)}`}
                  >
                    {ev.status}
                  </span>
                  <Link
                    href={`/events/${ev.id}/quotes`}
                    className="flex items-center gap-1 text-label-md font-semibold text-primary"
                  >
                    Quotes
                    <MaterialIcon name="chevron_right" size={18} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </DashboardShell>
  );
}
