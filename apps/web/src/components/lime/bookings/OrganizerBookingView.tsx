'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { BookingChat } from './BookingChat';
import type { BookingDetail } from './types';
import { cn } from '@/lib/utils';

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

  const step = timelineStep(booking.status);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface px-gutter py-4 shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-headline text-headline-md font-extrabold text-primary">
            LIME
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/artists" className="rounded px-3 py-1 font-label-md text-secondary hover:bg-surface-container-high">
              Explore
            </Link>
            <Link href="/dashboard/bookings" className="rounded px-3 py-1 font-label-md font-bold text-primary">
              Bookings
            </Link>
          </nav>
        </div>
        <Link href="/notifications" className="rounded-full p-2 text-secondary hover:bg-surface-container-high">
          <MaterialIcon name="notifications" />
        </Link>
      </header>

      <div className="flex h-[calc(100vh-72px)] overflow-hidden">
        <aside className="hidden w-64 flex-col gap-2 border-r border-outline-variant bg-surface-container-lowest p-4 lg:flex">
          <div className="mb-8 px-2">
            <h2 className="font-headline text-headline-md font-black text-primary">Organizer Portal</h2>
            <p className="font-label-sm text-secondary">Manage your talent</p>
          </div>
          <nav className="flex flex-col gap-1">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-4 py-3 font-label-md text-on-surface-variant hover:translate-x-1">
              <MaterialIcon name="dashboard" /> Dashboard
            </Link>
            <Link href="/dashboard/events" className="flex items-center gap-3 rounded-lg px-4 py-3 font-label-md text-on-surface-variant hover:translate-x-1">
              <MaterialIcon name="event" /> My Events
            </Link>
            <Link href="/dashboard/bookings" className="flex items-center gap-3 rounded-lg bg-primary-container px-4 py-3 font-label-md font-bold text-on-primary-container">
              <MaterialIcon name="book_online" /> Bookings
            </Link>
          </nav>
          <Link
            href="/events/new"
            className="mt-auto w-full rounded-lg bg-primary-container py-3 text-center font-label-md font-bold text-on-primary-container"
          >
            Create Event
          </Link>
        </aside>

        <main className="flex-1 overflow-y-auto p-gutter lg:p-10">
          <div className="mx-auto max-w-container-max">
            <Link
              href="/dashboard/bookings"
              className="group mb-8 inline-flex items-center gap-2 font-label-md text-secondary hover:text-primary"
            >
              <MaterialIcon name="arrow_back" className="transition-transform group-hover:-translate-x-1" />
              Back to all bookings
            </Link>

            {error && (
              <div className="mb-6">
                <ErrorAlert message={error} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-3">
                <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-transform hover:scale-[1.01]">
                  <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-lime/40 to-surface-container">
                    <span className="text-5xl font-bold text-primary">{artistName.charAt(0)}</span>
                    <span className="absolute bottom-4 left-4 rounded-full bg-primary-container px-3 py-1 font-label-sm text-on-primary-container shadow-sm">
                      Artist
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="mb-1 font-headline text-headline-md">{artistName}</h3>
                    <div className="mb-4 flex items-center gap-1 text-primary">
                      <MaterialIcon name="star" size={16} filled />
                      <span className="font-label-md">{profile?.avg_rating?.toFixed(1) ?? '—'}</span>
                      <span className="ml-1 text-secondary">({profile?.total_bookings ?? 0} bookings)</span>
                    </div>
                    <div className="mb-6 flex flex-wrap gap-2">
                      {(profile?.genres ?? []).slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="rounded-full bg-secondary-container px-3 py-1 font-label-sm text-on-secondary-container"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    {profile?.id && (
                      <Link
                        href={`/artists/${profile.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-outline-variant py-2.5 font-label-md transition-all hover:border-primary"
                      >
                        View Full Profile
                        <MaterialIcon name="open_in_new" size={16} />
                      </Link>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border-l-4 border-primary bg-surface-container-high p-4">
                  <h4 className="mb-2 font-label-md uppercase text-primary">Event Details</h4>
                  <p className="mb-1 font-bold">{ev.title}</p>
                  <p className="text-secondary">
                    {new Date(ev.event_date).toLocaleDateString()}
                    {ev.start_time ? ` • ${ev.start_time}` : ''}
                  </p>
                  <p className="text-secondary">{ev.venue ?? ev.city ?? 'Tunisia'}</p>
                </div>
              </div>

              <div className="rounded-xl bg-surface-container-lowest p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:col-span-4">
                <h3 className="mb-8 font-headline text-headline-md">Booking Timeline</h3>
                <div className="relative space-y-10">
                  <TimelineStep
                    done={step >= 1}
                    active={step === 1}
                    icon="check"
                    title="Request Sent"
                    subtitle={new Date(booking.created_at).toLocaleString()}
                  />
                  <TimelineStep
                    done={step >= 2}
                    active={step === 2}
                    icon="pending"
                    title="Quote Received"
                    subtitle={
                      booking.status === 'quoted' && booking.quote_amount
                        ? undefined
                        : 'Awaiting artist quote'
                    }
                  >
                    {booking.status === 'quoted' && booking.quote_amount != null && (
                      <div className="mt-3 rounded-lg border border-outline-variant bg-surface p-4">
                        <p className="mb-1 font-bold">Artist Fee: {booking.quote_amount.toLocaleString()} TND</p>
                        {typeof booking.quote_conditions === 'object' &&
                          booking.quote_conditions &&
                          'note' in booking.quote_conditions && (
                            <p className="mb-3 text-label-sm text-secondary">
                              {String((booking.quote_conditions as { note?: string }).note)}
                            </p>
                          )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={accept}
                            className="rounded-lg bg-primary px-4 py-2 text-label-sm font-bold text-white hover:opacity-90"
                          >
                            Accept Quote
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={decline}
                            className="rounded-lg border border-outline px-4 py-2 text-label-sm font-bold text-secondary"
                          >
                            Decline
                          </button>
                          <Link
                            href={`/events/${ev.id}/quotes`}
                            className="rounded-lg border border-primary px-4 py-2 text-label-sm font-bold text-primary"
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
                    title="Quote Accepted"
                    subtitle={step >= 3 ? 'Confirmed' : 'Awaiting your action'}
                    muted={step < 3}
                  />
                  <TimelineStep
                    done={step >= 4}
                    active={step === 4}
                    icon="description"
                    title="Contract Signed"
                    subtitle={
                      booking.contract ? (
                        <Link href={`/contracts/${booking.contract.id}`} className="text-primary hover:underline">
                          Open contract →
                        </Link>
                      ) : (
                        'Legal review needed'
                      )
                    }
                    muted={step < 4}
                  />
                  <TimelineStep
                    done={step >= 5}
                    icon="celebration"
                    title="Event Completed"
                    subtitle="Post-event feedback"
                    muted={step < 5}
                    last
                  />
                </div>
              </div>

              <BookingChat
                booking={booking}
                meId={meId}
                peerName={artistName}
                onSend={onSendMessage}
                compact
              />
            </div>
          </div>
        </main>
      </div>
    </div>
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
    <div className={cn('relative flex items-start gap-6', muted && 'opacity-40')}>
      {!last && (
        <div
          className={cn(
            'stepper-line absolute bottom-0 left-4 top-8 w-0.5',
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
              ? 'bg-primary-container text-on-primary-container ring-4 ring-primary-fixed'
              : 'bg-surface-container-high text-secondary',
        )}
      >
        <MaterialIcon name={icon} size={16} />
      </div>
      <div className="flex-1 pb-2">
        <h4 className={cn('font-label-md', active && 'font-bold text-primary')}>{title}</h4>
        {subtitle && <p className="font-label-sm text-secondary">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
