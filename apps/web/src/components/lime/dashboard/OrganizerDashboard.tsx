'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { DashboardShell } from './DashboardShell';
import { StatCard } from './StatCard';
import { useDbUser } from '@/components/providers/UserSessionProvider';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

type EventRow = {
  id: string;
  title: string;
  city?: string | null;
  venue?: string | null;
  event_date: string;
  status: string;
  booking_requests: {
    id: string;
    status: string;
    artist: { artist_profile?: { display_name: string } | null };
  }[];
};

type BookingRow = {
  id: string;
  status: string;
  created_at: string;
  event: { title: string };
  artist: { artist_profile?: { display_name: string } | null };
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
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

export function OrganizerDashboard() {
  const { user: dbUser, loading: sessionLoading } = useDbUser();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const me = dbUser ? { email: dbUser.email } : null;

  useEffect(() => {
    if (sessionLoading) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/events/mine'),
      api.get('/booking-requests'),
      api.get('/notifications'),
    ])
      .then(([evRes, bkRes, nRes]) => {
        setEvents(evRes.data);
        setBookings(bkRes.data);
        setNotifications(nRes.data.slice(0, 4));
      })
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, [sessionLoading]);

  const stats = useMemo(() => {
    const activeEvents = events.filter((e) => e.status !== 'cancelled').length;
    const pending = bookings.filter((b) =>
      ['pending', 'quoted', 'negotiating'].includes(b.status),
    ).length;
    const signed = bookings.filter((b) =>
      ['accepted', 'contracted', 'completed'].includes(b.status),
    ).length;
    return { activeEvents, pending, signed };
  }, [events, bookings]);

  const firstName = me?.email?.split('@')[0] ?? 'there';

  if (sessionLoading || loading) {
    return (
      <DashboardShell title="Dashboard" showNewEvent>
        <LoadingBlock label="Loading dashboard…" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={`Welcome back, ${firstName}`}
      subtitle="Here's what's happening with your events today."
      showNewEvent
    >
      {error && (
        <div className="mb-8">
          <ErrorAlert title="Could not load dashboard" message={error} />
        </div>
      )}

      <div className="mb-12 grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Events" value={stats.activeEvents} icon="event" hint="+ this month" />
        <StatCard
          label="Pending Requests"
          value={String(stats.pending).padStart(2, '0')}
          icon="send"
          hint={`${stats.pending} awaiting`}
          iconClassName="text-secondary"
        />
        <StatCard label="Contracts Signed" value={stats.signed} icon="verified_user" hint="Secure" />
        <StatCard
          label="Total Bookings"
          value={bookings.length}
          icon="account_balance_wallet"
          iconClassName="text-secondary"
        />
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="space-y-12 lg:col-span-2">
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline text-headline-md">My Active Events</h3>
              <Link href="/dashboard/events" className="text-label-md font-semibold text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-6">
              {events.length === 0 ? (
                <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-8 text-center">
                  <p className="text-secondary">No events yet.</p>
                  <Link href="/events/new" className="lime-btn-pill mt-4 inline-block text-sm">
                    Create your first event
                  </Link>
                </div>
              ) : (
                events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className="dashboard-shadow group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest md:flex-row"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-lime/30 to-surface-container md:w-48">
                      <span
                        className={`absolute left-2 top-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusBadge(ev.status)}`}
                      >
                        {ev.status}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="mb-1 font-headline text-headline-md">{ev.title}</h4>
                          <span className="text-label-sm text-secondary">
                            {new Date(ev.event_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mb-4 flex items-center gap-1 text-body-md text-secondary">
                          <MaterialIcon name="location_on" size={18} />
                          {ev.venue ?? ev.city ?? 'Tunisia'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-3">
                          {ev.booking_requests.slice(0, 3).map((br) => (
                            <div
                              key={br.id}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-lime/40 text-[10px] font-bold"
                              title={br.artist.artist_profile?.display_name}
                            >
                              {br.artist.artist_profile?.display_name?.charAt(0) ?? '?'}
                            </div>
                          ))}
                          {ev.booking_requests.length > 3 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-surface-container text-[10px] font-bold text-secondary">
                              +{ev.booking_requests.length - 3}
                            </div>
                          )}
                        </div>
                        <Link
                          href={
                            ev.booking_requests.some((b) => b.status === 'quoted')
                              ? `/events/${ev.id}/quotes`
                              : `/events/${ev.id}/matches`
                          }
                          className="rounded-lg border-2 border-on-surface px-4 py-2 text-label-md font-semibold transition-colors hover:bg-on-surface hover:text-surface-container-lowest"
                        >
                          {ev.booking_requests.some((b) => b.status === 'quoted')
                            ? 'Review Quotes'
                            : 'Select Talent'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <section>
            <h3 className="mb-6 font-headline text-headline-md">Recent Activity</h3>
            <div className="dashboard-shadow relative space-y-6 overflow-hidden rounded-xl bg-surface-container-lowest p-6">
              <div className="absolute bottom-10 left-8 top-10 w-0.5 bg-surface-container" />
              {notifications.length === 0 ? (
                <p className="text-sm text-secondary">No recent notifications.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="relative pl-10">
                    <div className="absolute left-[-4px] top-1 h-4 w-4 rounded-full border-4 border-surface-container-lowest bg-primary-container" />
                    <p className="text-label-md text-on-surface">{n.title}</p>
                    <p className="text-label-sm text-secondary">{n.body}</p>
                    <p className="mt-1 text-[10px] uppercase text-secondary/60">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-6 font-headline text-headline-md">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/explore/artists"
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-transparent bg-surface-container-low p-4 text-secondary transition-all hover:border-primary-container/30 hover:bg-primary-container/10 hover:text-primary"
              >
                <MaterialIcon name="search" size={32} className="transition-transform group-hover:scale-110" />
                <span className="text-label-sm">Browse Artists</span>
              </Link>
              <Link
                href="/events/new"
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-transparent bg-surface-container-low p-4 text-secondary transition-all hover:border-primary-container/30 hover:bg-primary-container/10 hover:text-primary"
              >
                <MaterialIcon name="add" size={32} className="transition-transform group-hover:scale-110" />
                <span className="text-label-sm">New Event</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
