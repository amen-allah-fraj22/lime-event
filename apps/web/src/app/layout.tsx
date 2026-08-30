import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { Plus_Jakarta_Sans, Hanken_Grotesk } from 'next/font/google';
import { ClientProviders } from '@/components/providers/ClientProviders';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LIME — Fresh bookings, Fresh talent.',
    template: '%s | LIME Event',
  },
  description:
    'Music and event talent marketplace for Tunisia. Book artists, manage events, and sign contracts in one place.',
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  openGraph: {
    title: 'LIME Event',
    description: 'Fresh bookings, fresh talent — weddings, corporate events, and festivals in Tunisia.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className="scroll-smooth">
        <body
          className={`${plusJakarta.variable} ${hanken.variable} font-body antialiased bg-surface text-brand-text`}
        >
          <ClientProviders>{children}</ClientProviders>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
