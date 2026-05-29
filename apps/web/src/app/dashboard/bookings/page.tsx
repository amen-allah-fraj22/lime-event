'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import { useRole } from '@/context/RoleContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

type BookingRow = {
  id: string;
  status: string;
  quote_amount?: number | null;
  created_at: string;
  event: { title: string; event_date: string };
  artist: { artist_profile?: { display_name: string } | null };
  organizer: { email: string };
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  quoted: 'Quoted',
  accepted: 'Accepted',
  contracted: 'Contracted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function DashboardBookingsPage() {
  const { activeRole, hasRole } = useRole();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/booking-requests')
      .then((res) => setBookings(res.data))
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, []);

  const showNewEvent = hasRole('organizer') || hasRole('agency');

  return (
    <DashboardShell
      title="Bookings"
      subtitle={
        activeRole === 'artist'
          ? 'All requests and confirmed gigs.'
          : 'Track quotes, contracts, and talent.'
      }
      showNewEvent={showNewEvent}
    >
      {loading && <LoadingBlock label="Loading bookings…" />}
      {error && <ErrorAlert title="Could not load bookings" message={error} />}
      {!loading && !error && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p className="text-secondary">No bookings yet.</p>
          ) : (
            bookings.map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="dashboard-shadow block rounded-xl bg-surface-container-lowest p-6 transition hover:bg-surface-container-low"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-headline text-title-md">{b.event.title}</h3>
                    <p className="mt-1 text-body-md text-secondary">
                      {activeRole === 'artist'
                        ? b.organizer.email
                        : b.artist.artist_profile?.display_name ?? 'Artist'}
                    </p>
                  </div>
                  <span className="rounded-full bg-tertiary-container px-3 py-1 text-label-sm font-semibold capitalize text-on-tertiary-container">
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </DashboardShell>
  );
}
