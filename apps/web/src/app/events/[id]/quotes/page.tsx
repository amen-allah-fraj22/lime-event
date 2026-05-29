'use client';

import { useParams } from 'next/navigation';
import { QuoteComparisonPage } from '@/components/lime/events/QuoteComparisonPage';

export default function EventQuotesPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <QuoteComparisonPage eventId={id} />;
}
