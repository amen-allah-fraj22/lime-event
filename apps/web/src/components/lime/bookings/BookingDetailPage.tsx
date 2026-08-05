'use client';

import { useCallback, useEffect, useState } from 'react';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { useDbUser } from '@/components/providers/UserSessionProvider';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { BookingConversationView } from './BookingConversationView';
import type { BookingDetail } from './types';

export function BookingDetailPage({ bookingId }: { bookingId: string }) {
  const { user: dbUser, loading: sessionLoading } = useDbUser();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const meId = dbUser?.id ?? null;

  const load = useCallback(async () => {
    const bRes = await api.get(`/booking-requests/${bookingId}`);
    setBooking(bRes.data);
    setError(null);
  }, [bookingId]);

  useEffect(() => {
    if (sessionLoading) return;

    if (!meId) {
      setLoading(false);
      setBooking(null);
      return;
    }

    setLoading(true);
    load()
      .catch((e) => {
        const info = getApiErrorMessage(e);
        if (info.status === 403) {
          setError('You do not have access to this booking.');
        } else if (info.status === 404) {
          setError('This booking does not exist or was removed.');
        } else {
          setError(info.message);
        }
        setBooking(null);
      })
      .finally(() => setLoading(false));
  }, [load, sessionLoading, meId]);

  useEffect(() => {
    if (sessionLoading || !meId) return;
    const interval = setInterval(() => {
      void load().catch(() => undefined);
    }, 12000);
    return () => clearInterval(interval);
  }, [load, sessionLoading, meId]);

  if (sessionLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingBlock label="Loading booking…" />
      </div>
    );
  }

  if (!meId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorAlert
          title="Booking unavailable"
          message="Your session could not be loaded. Sign out and sign in again, or refresh the page."
        />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorAlert title="Booking unavailable" message={error ?? 'Booking not found'} />
      </div>
    );
  }

  const isArtist = meId === booking.artist.id;

  return (
    <BookingConversationView
      booking={booking}
      meId={meId}
      isArtist={isArtist}
      onBookingActivity={() => void load()}
    />
  );
}
