'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { DashboardShell } from './DashboardShell';
import { StatCard } from './StatCard';
import { ProfileCompletionBanner } from './ProfileCompletionBanner';
import { useDbUser } from '@/components/providers/UserSessionProvider';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

type BookingRow = {
  id: string;
  status: string;
  quote_amount?: number | null;
  created_at: string;
  event: {
    title: string;
    event_type: string;
    event_date: string;
    city?: string | null;
  };
  organizer: { email: string };
  payment?: { net_amount: number; status: string } | null;
};

export function ArtistDashboard() {
  const { user: dbUser, loading: sessionLoading } = useDbUser();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const me = dbUser;

  useEffect(() => {
    if (sessionLoading) return;
    setLoading(true);
    api
      .get('/booking-requests')
      .then((res) => setBookings(res.data))
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, [sessionLoading]);

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const active = bookings.filter((b) =>
      ['quoted', 'accepted', 'contracted'].includes(b.status),
    ).length;
    const confirmed = bookings.filter((b) =>
      ['accepted', 'contracted', 'completed'].includes(b.status),
    ).length;
    return { pending, active, confirmed };
  }, [bookings]);

  const pendingRequests = bookings.filter((b) => b.status === 'pending');
  const upcoming = bookings
    .filter((b) => ['accepted', 'contracted'].includes(b.status))
    .sort((a, b) => new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime())
    .slice(0, 4);

  const displayName = me?.artist_profile?.display_name ?? me?.email?.split('@')[0] ?? 'Artist';

  if (sessionLoading || loading) {
    return (
      <DashboardShell title="Artist Dashboard">
        <LoadingBlock label="Loading dashboard…" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Artist Dashboard"
      subtitle={`Welcome back, ${displayName}. You have ${stats.pending} new booking request${stats.pending === 1 ? '' : 's'} today.`}
    >
      {error && (
        <div className="mb-8">
          <ErrorAlert title="Could not load dashboard" message={error} />
        </div>
      )}

      {me?.artist_profile && (
        <ProfileCompletionBanner
          artistProfileId={me.artist_profile.id}
          profileCompletion={me.artist_profile.profile_completion ?? 0}
          isProfileComplete={me.artist_profile.is_profile_complete ?? false}
          isVerified={me.is_verified ?? false}
        />
      )}

      <div className="mb-12 grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending Requests"
          value={stats.pending}
          icon="pending_actions"
          iconClassName="text-amber-600"
          iconWrapClassName="bg-amber-100"
          hint={stats.pending > 0 ? '+ new' : undefined}
        />
        <StatCard
          label="Active Bookings"
          value={stats.active}
          icon="confirmation_number"
          iconClassName="text-blue-600"
          iconWrapClassName="bg-blue-100"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon="check_circle"
          iconClassName="text-primary"
          iconWrapClassName="bg-primary-container/20"
        />
        <StatCard
          label="Profile"
          value={me?.artist_profile ? (me.artist_profile.is_profile_complete ? 'Live' : 'Setup') : 'Setup'}
          icon="visibility"
          iconClassName="text-secondary"
          iconWrapClassName="bg-surface-variant"
          hint={me?.artist_profile?.is_profile_complete ? '+ views' : 'Complete profile'}
        />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <section className="lg:col-span-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-headline-md">New Booking Requests</h3>
            <Link href="/dashboard/bookings" className="text-label-md font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="dashboard-shadow rounded-xl border border-surface-variant/10 bg-white p-8 text-center">
                <p className="text-secondary">No pending requests — check back soon.</p>
                {me?.artist_profile && !me.artist_profile.is_profile_complete && (
                  <Link
                    href={`/artists/${me.artist_profile.id}/edit`}
                    className="mt-4 inline-block text-label-md font-bold text-primary"
                  >
                    Complete your profile →
                  </Link>
                )}
              </div>
            ) : (
              pendingRequests.slice(0, 5).map((br) => (
                <div
                  key={br.id}
                  className="dashboard-shadow flex flex-col items-start gap-6 rounded-xl border border-surface-variant/10 bg-white p-6 transition-transform hover:scale-[1.005] md:flex-row md:items-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-lime/40 to-surface-container">
                    <MaterialIcon name="music_note" className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {br.event.event_type}
                      </span>
                      <h4 className="font-bold text-body-lg">{br.event.title}</h4>
                    </div>
                    <p className="flex items-center gap-2 text-body-md text-secondary">
                      <MaterialIcon name="person" size={18} />
                      {br.organizer.email}
                      <span className="mx-2 text-surface-variant">•</span>
                      <MaterialIcon name="location_on" size={18} />
                      {br.event.city ?? 'Tunisia'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-label-md font-semibold">
                      <span className="flex items-center gap-1">
                        <MaterialIcon name="calendar_today" size={18} className="text-primary" />
                        {new Date(br.event.event_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex w-full gap-3 md:w-auto">
                    <Link
                      href={`/bookings/${br.id}`}
                      className="flex-1 rounded-lg border-2 border-on-background px-4 py-2 text-center text-label-md font-bold transition-all hover:bg-surface-container md:flex-none"
                    >
                      Send Quote
                    </Link>
                    <Link
                      href={`/bookings/${br.id}`}
                      className="flex-1 rounded-lg bg-primary-container px-4 py-2 text-center text-label-md font-bold text-on-primary-fixed transition-all hover:opacity-90 md:flex-none"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="lg:col-span-4">
          <div className="dashboard-shadow h-full rounded-xl border border-surface-variant/10 bg-white p-8">
            <h3 className="mb-8 font-headline text-headline-md">Upcoming Events</h3>
            <div className="relative space-y-12 pl-8">
              <div className="absolute bottom-1 left-[11px] top-1 w-0.5 bg-surface-container-highest" />
              {upcoming.length === 0 ? (
                <p className="text-sm text-secondary">No confirmed gigs yet.</p>
              ) : (
                upcoming.map((br, i) => (
                  <div key={br.id} className="relative">
                    <div
                      className={`absolute -left-[27px] top-1 h-4 w-4 rounded-full border-4 border-white shadow-sm ${
                        i === 0 ? 'bg-primary ring-4 ring-primary-container/20' : 'bg-secondary'
                      }`}
                    />
                    <p className={`mb-1 text-label-sm font-bold ${i === 0 ? 'text-primary' : 'text-secondary'}`}>
                      {new Date(br.event.event_date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <h4 className="font-bold text-body-lg">{br.event.title}</h4>
                    <p className="text-label-md text-secondary">{br.event.city ?? 'Tunisia'}</p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/calendar"
              className="mt-12 flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low py-3 text-label-md font-bold transition-all hover:bg-surface-container-highest"
            >
              <MaterialIcon name="calendar_month" size={20} />
              Open Calendar
            </Link>
          </div>
        </aside>
      </div>

      <Link
        href="/dashboard/bookings"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary-fixed shadow-lg transition-all hover:scale-110 active:scale-95"
        title="Quick quote"
      >
        <MaterialIcon name="add" size={28} />
      </Link>
    </DashboardShell>
  );
}
