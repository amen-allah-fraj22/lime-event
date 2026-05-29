'use client';

import { useParams } from 'next/navigation';
import { BookingDetailPage } from '@/components/lime/bookings/BookingDetailPage';

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <BookingDetailPage bookingId={id} />;
}
