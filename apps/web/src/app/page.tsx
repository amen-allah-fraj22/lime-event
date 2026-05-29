import type { Metadata } from 'next';
import { LandingPage } from '@/components/lime/landing/LandingPage';

export const metadata: Metadata = {
  title: 'LIME — Fresh bookings, Fresh talent.',
  description:
    'Discover and book artists in Tunisia. Organizers create events; artists receive quotes and contracts.',
};

/** Static home page for fast TTFB and SEO (no force-dynamic on root layout). */
export const revalidate = 3600;

export default function HomePage() {
  return <LandingPage />;
}
