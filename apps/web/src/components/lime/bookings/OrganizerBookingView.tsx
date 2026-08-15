'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import { BookingChat } from './BookingChat';
import type { BookingDetail } from './types';
import { cn } from '@/lib/utils';

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    quoted: 'Quote received',
    negotiating: 'Negotiating',
    accepted: 'Accepted',
    contracted: 'Contracted',
    completed: 'Completed',
    declined: 'Declined',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return map[status] ?? status;
}

export function OrganizerBookingView({
  booking,
  meId,
  onReload,
  onSendMessage,
  onAccept,
  onDecline,
}: {
  booking: BookingDetail;
  meId: string;
  onReload: () => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
  onAccept: () => Promise<BookingDetail>;
  onDecline: () => Promise<void>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = booking.artist.artist_profile;
  const artistName = profile?.display_name ?? 'Artist';
  const ev = booking.event;
  const step = timelineStep(booking.status);

  async function accept() {
    setLoading(true);
    setError(null);
    try {
      const updated = await onAccept();
      const contractId = updated.contract?.id;
      if (contractId) {
        router.push(`/contracts/${contractId}`);
      } else {
        await onReload();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to accept');
    } finally {
      setLoading(false);
    }
  }

  async function decline() {
    setLoading(true);
    try {
      await onDecline();
      await onReload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to decline');
    } finally {
      setLoading(false);
    }
  }

  const eventWhen = `${new Date(ev.event_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}${ev.start_time ? ` · ${ev.start_time}` : ''}`;

  return (
    <DashboardShell title="Booking details" showNewEvent={false}>
      <div className="mx-auto w-full max-w-[1600px]">
        <Link
          href="/dashboard/bookings"
          className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
        >
          <MaterialIcon name="arrow_back" className="transition-transform group-hover:-translate-x-1" />
          Back to all bookings
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface sm:text-2xl">
              {ev.title}
            </h2>
            <p className="mt-1 text-sm text-secondary">
              with {artistName} · {eventWhen}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide',
              booking.status === 'pending' && 'bg-amber-100 text-amber-900',
              booking.status === 'quoted' && 'bg-primary-container/30 text-primary',
              (booking.status === 'accepted' || booking.status === 'contracted') &&
                'bg-lime/30 text-primary',
              booking.status === 'declined' && 'bg-red-100 text-red-800',
              !['pending', 'quoted', 'accepted', 'contracted', 'declined'].includes(
                booking.status,
              ) && 'bg-surface-container-high text-secondary',
            )}
          >
            {statusLabel(booking.status)}
          </span>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-12 xl:items-start">
          {/* Artist + event — full width on mobile, left column on desktop */}
          <div className="space-y-4 lg:col-span-1 xl:col-span-4">
            <div className="overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-card">
              <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-lime/40 to-surface-container sm:h-40">
                <span className="text-4xl font-bold text-primary sm:text-5xl">
                  {artistName.charAt(0)}
                </span>
                <span className="absolute bottom-3 left-3 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container">
                  Artist
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="font-headline text-lg font-bold">{artistName}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-primary">
                  <MaterialIcon name="star" size={16} filled />
                  <span className="font-semibold">
                    {profile?.avg_rating?.toFixed(1) ?? '—'}
                  </span>
                  <span className="text-secondary">
                    ({profile?.total_bookings ?? 0} bookings)
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(profile?.genres ?? []).slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                {profile?.id && (
                  <Link
                    href={`/artists/${profile.id}`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-outline-variant py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                  >
                    View full profile
                    <MaterialIcon name="open_in_new" size={16} />
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-surface-variant border-l-4 border-l-primary bg-surface-container-low p-5">
              <h4 className="text-xs font-bold uppercase tracking-wide text-primary">
                Event details
              </h4>
              <p className="mt-2 font-semibold text-on-surface">{ev.title}</p>
              <p className="mt-1 text-sm text-secondary">{eventWhen}</p>
              <p className="text-sm text-secondary">{ev.venue ?? ev.city ?? 'Tunisia'}</p>
              {ev.budget_min != null && ev.budget_max != null && (
                <p className="mt-2 text-sm text-secondary">
                  Budget: {ev.budget_min} – {ev.budget_max} TND
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <section className="rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-card sm:p-8 lg:col-span-1 xl:col-span-5">
            <h3 className="mb-6 font-headline text-lg font-bold sm:text-xl">
              Booking timeline
            </h3>
            <div className="relative space-y-8 sm:space-y-10">
              <TimelineStep
                done={step >= 1}
                active={step === 1}
                icon="check"
                title="Request sent"
                subtitle={new Date(booking.created_at).toLocaleString()}
              />
              <TimelineStep
                done={step >= 2}
                active={step === 2}
                icon="pending"
                title="Quote received"
                subtitle={
                  booking.status === 'quoted' && booking.quote_amount
                    ? undefined
                    : 'Awaiting artist quote'
                }
              >
                {booking.status === 'quoted' && booking.quote_amount != null && (
                  <div className="mt-3 rounded-lg border border-outline-variant bg-surface p-4">
                    <p className="font-bold">
                      Artist fee: {booking.quote_amount.toLocaleString()} TND
                    </p>
                    {typeof booking.quote_conditions === 'object' &&
                      booking.quote_conditions &&
                      'note' in booking.quote_conditions && (
                        <p className="mb-3 mt-1 text-sm text-secondary">
                          {String((booking.quote_conditions as { note?: string }).note)}
                        </p>
                      )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={accept}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                      >
                        Accept quote
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={decline}
                        className="rounded-lg border border-outline px-4 py-2 text-sm font-bold text-secondary"
                      >
                        Decline
                      </button>
                      <Link
                        href={`/events/${ev.id}/quotes`}
                        className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
                      >
                        Compare
                      </Link>
                    </div>
                  </div>
                )}
              </TimelineStep>
              <TimelineStep
                done={step >= 3}
                active={step === 3}
                icon="circle"
                title="Quote accepted"
                subtitle={step >= 3 ? 'Confirmed' : 'Awaiting your action'}
                muted={step < 3}
              />
              <TimelineStep
                done={step >= 4}
                active={step === 4}
                icon="description"
                title="Contract signed"
                subtitle={
                  booking.contract ? (
                    <Link
                      href={`/contracts/${booking.contract.id}`}
                      className="text-primary hover:underline"
                    >
                      Open contract →
                    </Link>
                  ) : (
                    'Legal review needed'
                  )
                }
                muted={step < 4}
              >
                {step >= 4 && (
                  <div className="mt-3 rounded-lg border border-outline-variant bg-surface p-4 text-sm text-secondary">
                    <p className="font-semibold text-on-surface">About payment</p>
                    <p className="mt-1">
                      LIME does not process payments automatically yet. Use the chat to agree on
                      payment method and timing with the artist directly — the fee is due as
                      stated in the signed contract.
                    </p>
                  </div>
                )}
              </TimelineStep>
              <TimelineStep
                done={step >= 5}
                icon="celebration"
                title="Event completed"
                subtitle="Post-event feedback"
                muted={step < 5}
                last
              />
            </div>
          </section>

          {/* Chat — full width on mobile/tablet, sticky column on xl */}
          <div className="min-w-0 lg:col-span-2 xl:col-span-3 xl:sticky xl:top-6 xl:max-h-[calc(100vh-7rem)]">
            <BookingChat
              booking={booking}
              meId={meId}
              peerName={artistName}
              onSend={onSendMessage}
              className="xl:max-h-[calc(100vh-7rem)]"
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function timelineStep(status: string): number {
  if (status === 'completed') return 5;
  if (status === 'contracted' || status === 'accepted') return 4;
  if (status === 'quoted' || status === 'negotiating') return 2;
  if (status === 'pending') return 1;
  return 1;
}

function TimelineStep({
  done,
  active,
  icon,
  title,
  subtitle,
  children,
  muted,
  last,
}: {
  done?: boolean;
  active?: boolean;
  icon: string;
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn('relative flex items-start gap-4 sm:gap-6', muted && 'opacity-40')}>
      {!last && (
        <div
          className={cn(
            'absolute bottom-0 left-4 top-8 w-0.5 sm:left-4',
            done || active ? 'bg-primary-container' : 'bg-surface-container-highest',
          )}
        />
      )}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          done && !active
            ? 'bg-primary text-white'
            : active
              ? 'bg-primary-container text-on-primary-container ring-4 ring-primary-fixed/40'
              : 'bg-surface-container-high text-secondary',
        )}
      >
        <MaterialIcon name={icon} size={16} />
      </div>
      <div className="min-w-0 flex-1 pb-2">
        <h4 className={cn('text-sm font-semibold sm:text-base', active && 'text-primary')}>
          {title}
        </h4>
        {subtitle && <p className="mt-0.5 text-sm text-secondary">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
