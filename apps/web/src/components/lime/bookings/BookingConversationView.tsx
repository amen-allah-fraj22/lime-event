'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import { NegotiationThread } from '@/components/lime/NegotiationThread';
import { OfferSheet } from '@/components/lime/OfferSheet';
import { DayStatusModal } from '@/components/lime/calendar/DayStatusModal';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { isBookingConfirmed } from '@/lib/artist-equipment-options';
import {
  bookingStatusLabel,
  computeBookingTimelineStep,
} from '@/lib/booking-timeline';
import { cn } from '@/lib/utils';
import type { BookingDetail } from './types';

const STEPS = [
  'Request sent',
  'Artist responded',
  'Offer received',
  'Confirmed',
] as const;

export function BookingConversationView({
  booking,
  meId,
  isArtist,
  onBookingActivity,
}: {
  booking: BookingDetail;
  meId: string;
  isArtist: boolean;
  onBookingActivity?: () => void;
}) {
  const [showDayStatusModal, setShowDayStatusModal] = useState(false);
  const profile = booking.artist.artist_profile;
  const artistName = profile?.display_name ?? 'Artist';
  const ev = booking.event;
  const artistId = booking.artist.id;
  const offers = booking.negotiation_offers ?? [];
  const step = computeBookingTimelineStep({
    status: booking.status,
    artistId,
    messages: booking.messages,
    offers,
  });
  const badge = bookingStatusLabel(booking.status, artistId, booking.messages, offers);
  const showOfferSheet = isBookingConfirmed(booking.status) || booking.status === 'quoted';

  function handlePrint() {
    window.print();
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `Offer sheet — ${ev.title}\nArtist: ${artistName}\nDate: ${new Date(ev.event_date).toLocaleDateString()}\nView on LIME Event.`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  const eventWhen = `${new Date(ev.event_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}${ev.start_time ? ` · ${ev.start_time}` : ''}`;

  const dateStr = [
    new Date(ev.event_date).getFullYear(),
    String(new Date(ev.event_date).getMonth() + 1).padStart(2, '0'),
    String(new Date(ev.event_date).getDate()).padStart(2, '0'),
  ].join('-');

  return (
    <DashboardShell title="Booking" showNewEvent={!isArtist}>
      <Link
        href="/dashboard/bookings"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
      >
        <MaterialIcon name="arrow_back" size={18} />
        All bookings
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold">{ev.title}</h2>
          <p className="mt-1 text-sm text-secondary">
            {artistName} · {eventWhen}
          </p>
        </div>
        <span className="rounded-full bg-lime/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
          {badge}
        </span>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step >= n;
          const active = step === n;
          return (
            <div
              key={label}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
                done && 'bg-primary-container text-on-surface',
                !done && 'bg-surface-container-high text-secondary',
                active && 'ring-2 ring-primary/30',
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-[10px]">
                {done ? '✓' : n}
              </span>
              {label}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          {profile?.id && (
            <Link
              href={`/artists/${profile.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View artist profile
              <MaterialIcon name="open_in_new" size={16} />
            </Link>
          )}
          {showOfferSheet && profile ? (
            <OfferSheet
              booking={booking}
              onPrint={isBookingConfirmed(booking.status) ? handlePrint : undefined}
              onShareWhatsApp={
                isBookingConfirmed(booking.status) ? handleShareWhatsApp : undefined
              }
            />
          ) : (
            <div className="lime-card p-6 text-sm text-secondary">
              <p className="font-semibold text-on-surface">Event summary</p>
              <p className="mt-2">{ev.venue ?? ev.city ?? 'Tunisia'}</p>
              {ev.budget_min != null && ev.budget_max != null && (
                <p className="mt-1">
                  Your budget: {ev.budget_min} – {ev.budget_max} TND
                </p>
              )}
              <p className="mt-4">
                Use the negotiation panel to discuss details and send offers. When you agree on a
                fee, accept the offer to confirm.
              </p>
            </div>
          )}
        </div>

        <div className="xl:col-span-5">
          <div className="lime-card sticky top-24 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-headline text-lg font-bold">
              <MaterialIcon name="forum" size={22} />
              {isBookingConfirmed(booking.status) ? 'Conversation' : 'Negotiation'}
            </h3>
            <NegotiationThread
              bookingId={booking.id}
              currentUserId={meId}
              bookingStatus={booking.status}
              onActivity={onBookingActivity}
              onOfferAccepted={() => {
                if (isArtist) setShowDayStatusModal(true);
              }}
            />
          </div>
        </div>
      </div>

      {showDayStatusModal && (
        <DayStatusModal
          isOpen={showDayStatusModal}
          onClose={() => setShowDayStatusModal(false)}
          userId={meId}
          dateStr={dateStr}
        />
      )}
    </DashboardShell>
  );
}
