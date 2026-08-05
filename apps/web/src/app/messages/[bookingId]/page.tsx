'use client';

import { useParams } from 'next/navigation';
import { BookingDetailPage } from '@/components/lime/bookings/BookingDetailPage';

export default function MessageThreadPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  if (!bookingId) return null;

  return <BookingDetailPage bookingId={bookingId} />;
}
