'use client';

import { useCallback, useEffect, useState } from 'react';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { useDbUser } from '@/components/providers/UserSessionProvider';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ArtistBookingView } from './ArtistBookingView';
import { OrganizerBookingView } from './OrganizerBookingView';
import type { BookingDetail } from './types';

export function BookingDetailPage({ bookingId }: { bookingId: string }) {
  const { user: dbUser } = useDbUser();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const meId = dbUser?.id ?? null;

  const load = useCallback(async () => {
    const bRes = await api.get(`/booking-requests/${bookingId}`);
    setBooking(bRes.data);
  }, [bookingId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingBlock label="Loading booking…" />
      </div>
    );
  }

  if (error || !booking || !meId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorAlert title="Booking unavailable" message={error ?? 'Booking not found'} />
      </div>
    );
  }

  const isArtist = meId === booking.artist.id;

  async function sendMessage(content: string) {
    await api.post(`/booking-requests/${bookingId}/messages`, { content });
    await load();
  }

  async function sendQuote(payload: {
    quote_amount: number;
    quote_conditions: Record<string, unknown>;
  }) {
    await api.post(`/booking-requests/${bookingId}/quote`, payload);
  }

  async function acceptQuote(): Promise<BookingDetail> {
    const res = await api.post(`/booking-requests/${bookingId}/accept`);
    setBooking(res.data);
    return res.data;
  }

  async function decline() {
    await api.patch(`/booking-requests/${bookingId}/status`, { status: 'declined' });
  }

  if (isArtist) {
    return (
      <ArtistBookingView
        booking={booking}
        meId={meId}
        onReload={load}
        onSendMessage={sendMessage}
        onSendQuote={sendQuote}
      />
    );
  }

  return (
    <OrganizerBookingView
      booking={booking}
      meId={meId}
      onReload={load}
      onSendMessage={sendMessage}
      onAccept={acceptQuote}
      onDecline={decline}
    />
  );
}
