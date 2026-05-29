'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

type QuoteConditions = {
  highlights?: string[];
  performance?: string;
  equipment?: string;
  cancellation?: string;
};

type QuoteRow = {
  id: string;
  status: string;
  quote_amount: number | null;
  quote_conditions: QuoteConditions | null;
  quote_expires_at: string | null;
  artist: {
    artist_profile: {
      id: string;
      display_name: string;
      avg_rating: number;
      total_bookings: number;
      genres: string[];
    } | null;
  };
};

type EventInfo = {
  id: string;
  title: string;
  event_date: string;
  city?: string | null;
};

function parseConditions(raw: unknown): QuoteConditions {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  return {
    highlights: Array.isArray(o.highlights)
      ? o.highlights.filter((x): x is string => typeof x === 'string')
      : undefined,
    performance: typeof o.performance === 'string' ? o.performance : undefined,
    equipment: typeof o.equipment === 'string' ? o.equipment : undefined,
    cancellation: typeof o.cancellation === 'string' ? o.cancellation : undefined,
  };
}

function hoursUntilExpiry(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60));
}

export function QuoteComparisonPage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/events/${eventId}/quotes`)
      .then((res) => {
        setEvent(res.data.event);
        setQuotes(
          (res.data.quotes as QuoteRow[]).map((q) => ({
            ...q,
            quote_conditions: parseConditions(q.quote_conditions),
          })),
        );
      })
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, [eventId]);

  const bestValueId = useMemo(() => {
    const withAmount = quotes.filter((q) => q.quote_amount != null);
    if (withAmount.length === 0) return null;
    return [...withAmount].sort((a, b) => (a.quote_amount ?? 0) - (b.quote_amount ?? 0))[0]?.id ?? null;
  }, [quotes]);

  async function acceptQuote(bookingId: string) {
    setAcceptingId(bookingId);
    setError(null);
    try {
      const res = await api.post(`/booking-requests/${bookingId}/accept`);
      const contractId = res.data.contract?.id;
      if (contractId) {
        router.push(`/contracts/${contractId}`);
      } else {
        router.push(`/bookings/${bookingId}`);
      }
    } catch (e) {
      setError(getApiErrorMessage(e).message);
    } finally {
      setAcceptingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <QuoteHeader event={null} />
        <main className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
          <LoadingBlock label="Loading quotes…" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <QuoteHeader event={event} />
      <main className="mx-auto max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2 font-label-sm text-secondary">
            <Link href="/dashboard/events" className="transition-colors hover:text-primary">
              Events
            </Link>
            <MaterialIcon name="chevron_right" size={14} />
            <Link href={`/events/${eventId}/matches`} className="transition-colors hover:text-primary">
              {event?.title ?? 'Event'}
            </Link>
            <MaterialIcon name="chevron_right" size={14} />
            <span className="text-on-surface">Compare Quotes</span>
          </div>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="mb-2 font-headline text-headline-xl text-on-background">Quote Comparison</h1>
              <p className="font-body-lg text-body-lg text-secondary">
                Review and compare performance offers
                {event?.event_date
                  ? ` for ${new Date(event.event_date).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  : ''}
              </p>
            </div>
            {event?.event_date && (
              <div className="flex items-center gap-2 rounded-lg bg-secondary-container px-4 py-2">
                <MaterialIcon name="calendar_today" className="text-secondary" />
                <span className="font-label-md text-on-secondary-container">
                  {new Date(event.event_date).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8">
            <ErrorAlert message={error} />
          </div>
        )}

        {quotes.length === 0 ? (
          <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-12 text-center">
            <p className="text-body-lg text-secondary">No quotes yet for this event.</p>
            <Link
              href={`/events/${eventId}/matches`}
              className="mt-6 inline-flex items-center gap-2 font-bold text-primary hover:underline"
            >
              Browse matched artists
              <MaterialIcon name="arrow_forward" size={20} />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
              {quotes.map((q) => (
                <QuoteCard
                  key={q.id}
                  quote={q}
                  isBestValue={q.id === bestValueId}
                  accepting={acceptingId === q.id}
                  onAccept={() => acceptQuote(q.id)}
                />
              ))}
            </div>

            <ComparisonTable quotes={quotes} />
          </>
        )}
      </main>
    </div>
  );
}

function QuoteHeader({ event }: { event: EventInfo | null }) {
  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-surface px-gutter py-4 shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="font-headline text-headline-md font-extrabold text-primary">
          LIME
        </Link>
        <div className="mx-2 hidden h-6 w-px bg-outline-variant md:block" />
        <div className="hidden flex-col md:flex">
          <span className="font-label-sm uppercase tracking-wider text-secondary">Active Event</span>
          <span className="font-label-md text-on-surface">{event?.title ?? '…'}</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="hidden font-label-md font-bold text-primary md:block">
          Dashboard
        </Link>
        <Link
          href="/dashboard/events"
          className="hidden rounded px-2 py-1 font-label-md text-secondary transition-colors hover:bg-surface-container-high md:block"
        >
          My Events
        </Link>
        <Link href="/notifications" className="rounded-full p-2 text-secondary transition-colors hover:bg-surface-container-high">
          <MaterialIcon name="notifications" />
        </Link>
      </div>
    </header>
  );
}

function QuoteCard({
  quote,
  isBestValue,
  accepting,
  onAccept,
}: {
  quote: QuoteRow;
  isBestValue: boolean;
  accepting: boolean;
  onAccept: () => void;
}) {
  const profile = quote.artist.artist_profile;
  const name = profile?.display_name ?? 'Artist';
  const initials = name.charAt(0).toUpperCase();
  const hoursLeft = hoursUntilExpiry(quote.quote_expires_at);
  const conditions = quote.quote_conditions ?? {};
  const highlights =
    conditions.highlights ??
    [
      conditions.performance,
      conditions.equipment,
      conditions.cancellation,
    ].filter((x): x is string => Boolean(x));

  return (
    <div
      className={cn(
        'quote-card relative flex flex-col rounded-xl border bg-surface-container-lowest p-6 shadow-sm',
        isBestValue ? 'border-2 border-primary-container' : 'border-outline-variant',
      )}
    >
      {isBestValue && (
        <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary-container px-4 py-1 font-label-sm font-bold text-on-primary-container shadow-md">
          <MaterialIcon name="stars" size={16} filled />
          BEST VALUE
        </div>
      )}
      {hoursLeft != null && hoursLeft <= 24 && hoursLeft > 0 && !isBestValue && (
        <div className="absolute right-4 top-4 flex animate-pulse items-center gap-1 rounded bg-error-container px-2 py-1 font-label-sm font-bold text-on-error-container">
          <MaterialIcon name="timer" size={14} />
          Expiring in {hoursLeft}h
        </div>
      )}
      <div className={cn('mb-6 flex items-center gap-4', isBestValue && 'pt-2')}>
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 text-xl font-bold',
            isBestValue ? 'border-primary-container bg-lime/30 text-primary' : 'border-outline-variant bg-surface-container',
          )}
        >
          {initials}
        </div>
        <div>
          <h3 className="font-headline text-headline-md">{name}</h3>
          <div className="flex items-center gap-1 text-primary">
            <MaterialIcon name="star" size={18} filled />
            <span className="font-label-md">{profile?.avg_rating?.toFixed(1) ?? '—'}</span>
            <span className="font-normal text-secondary">
              ({profile?.total_bookings ?? 0} bookings)
            </span>
          </div>
        </div>
      </div>
      <div className="mb-6 flex-grow">
        <div className="mb-4 font-headline text-headline-lg text-on-surface">
          {(quote.quote_amount ?? 0).toLocaleString()}{' '}
          <span className="text-label-md font-normal text-secondary">TND</span>
        </div>
        <ul className="space-y-3">
          {highlights.length === 0 ? (
            <li className="flex items-start gap-3 font-body-md text-on-surface-variant">
              <MaterialIcon name="info" size={20} className="text-secondary" />
              <span>Quote details on request</span>
            </li>
          ) : (
            highlights.map((line, i) => (
              <li key={i} className="flex items-start gap-3 font-body-md text-on-surface-variant">
                <MaterialIcon
                  name={line.toLowerCase().includes('cancel') ? 'warning' : 'check_circle'}
                  size={20}
                  className={
                    line.toLowerCase().includes('flexible') || line.toLowerCase().includes('free')
                      ? 'text-primary'
                      : line.toLowerCase().includes('strict') || line.toLowerCase().includes('non-refundable')
                        ? 'text-error'
                        : 'text-primary'
                  }
                />
                <span
                  className={
                    line.toLowerCase().includes('flexible') ? 'font-bold text-primary' : undefined
                  }
                >
                  {line}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          disabled={accepting}
          onClick={onAccept}
          className="w-full rounded-lg bg-primary-container py-4 font-label-md font-bold text-on-primary-container transition-all hover:bg-primary-fixed active:scale-95 disabled:opacity-60"
        >
          {accepting ? 'Accepting…' : 'Accept This Quote'}
        </button>
        <Link
          href={`/bookings/${quote.id}`}
          className="flex w-full items-center justify-center rounded-lg border-2 border-outline py-4 font-label-md font-bold text-on-surface transition-all hover:bg-surface-container-high active:scale-95"
        >
          Send Message
        </Link>
      </div>
    </div>
  );
}

function ComparisonTable({ quotes }: { quotes: QuoteRow[] }) {
  const rows: { label: string; key: keyof QuoteConditions }[] = [
    { label: 'Performance', key: 'performance' },
    { label: 'Equipment', key: 'equipment' },
    { label: 'Cancellation', key: 'cancellation' },
  ];

  return (
    <div className="mt-16 rounded-xl border border-outline-variant bg-surface-container-low p-8">
      <h2 className="mb-6 font-headline text-headline-md">Quote Comparison Details</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="py-4 font-label-md uppercase tracking-widest text-secondary">Service</th>
              {quotes.map((q) => (
                <th key={q.id} className="py-4 font-label-md text-on-surface">
                  {q.artist.artist_profile?.display_name ?? 'Artist'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-body-md text-on-surface-variant">
            <tr className="border-b border-outline-variant transition-colors hover:bg-surface-container">
              <td className="py-4 font-bold text-on-surface">Price (TND)</td>
              {quotes.map((q) => (
                <td key={q.id} className="py-4 font-semibold text-primary">
                  {(q.quote_amount ?? 0).toLocaleString()}
                </td>
              ))}
            </tr>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-outline-variant transition-colors hover:bg-surface-container"
              >
                <td className="py-4 font-bold text-on-surface">{row.label}</td>
                {quotes.map((q) => (
                  <td key={q.id} className="py-4">
                    {q.quote_conditions?.[row.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
