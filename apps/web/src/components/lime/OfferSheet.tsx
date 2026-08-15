'use client';

import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { getNeedsLabels, getProvidesLabels, isBookingConfirmed } from '@/lib/artist-equipment-options';
import type { BookingDetail } from '@/components/lime/bookings/types';

export function OfferSheet({
  booking,
  onPrint,
  onShareWhatsApp,
}: {
  booking: BookingDetail;
  onPrint?: () => void;
  onShareWhatsApp?: () => void;
}) {
  const artist = booking.artist.artist_profile;
  const event = booking.event;
  if (!artist) return null;

  const profile = artist as unknown as Record<string, unknown>;
  const provides = getProvidesLabels(profile);
  const needs = getNeedsLabels(profile);
  const fee = booking.agreed_fee ?? booking.quote_amount;
  const confirmed = isBookingConfirmed(booking.status);

  return (
    <div className="lime-card overflow-hidden print:shadow-none" id="offer-sheet">
      <div className="border-b border-surface-variant p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              LIME Event — Offer sheet
            </p>
            <h2 className="mt-1 font-headline text-xl font-bold">{event.title}</h2>
            <p className="mt-1 text-sm text-secondary">
              {new Date(event.event_date).toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {event.city ? ` · ${event.city}` : ''}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              confirmed
                ? 'bg-lime/30 text-on-surface'
                : 'bg-surface-container-high text-secondary'
            }`}
          >
            {confirmed ? 'Confirmed' : 'In negotiation'}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoBlock
            label="Artist"
            value={artist.display_name}
            sub={
              artist.artist_type === 'band'
                ? `Band${artist.band_size ? ` · ${artist.band_size} members` : ''}`
                : 'Solo artist'
            }
          />
          <InfoBlock
            label="Event"
            value={event.event_type}
            sub={event.guest_count ? `${event.guest_count} guests` : undefined}
          />
        </div>

        {fee != null && (
          <div className="rounded-xl bg-surface-container-low px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Agreed fee</span>
              <span className="font-headline text-2xl font-bold text-primary">
                {fee.toLocaleString()} TND
              </span>
            </div>
            {confirmed && (
              <p className="mt-2 text-xs text-secondary">
                LIME does not process payments automatically yet — arrange payment method and
                timing directly with {/* keeps this true for both roles without picking a side */}
                the other party via the conversation below.
              </p>
            )}
          </div>
        )}

        {provides.length > 0 && (
          <TagSection title="Artist provides" tags={provides} variant="lime" />
        )}
        {needs.length > 0 && (
          <TagSection title="Organiser provides" tags={needs} variant="amber" />
        )}

        {(artist.setlist_duration_min || artist.setlist_duration_max) && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-secondary">
              Performance duration
            </h4>
            <p className="mt-1 text-sm">
              {artist.setlist_duration_min ?? '?'}–{artist.setlist_duration_max ?? '?'} minutes
            </p>
          </div>
        )}

        <p className="border-t border-surface-variant pt-4 text-xs leading-relaxed text-secondary">
          This offer sheet is a communication reference on LIME Event. It is not a legally binding
          contract. Confirm final details together before the event.
        </p>

        {(onPrint || onShareWhatsApp) && (
          <div className="flex flex-wrap gap-2 print:hidden">
            {onPrint && (
              <button type="button" onClick={onPrint} className="lime-btn-outline text-sm">
                <MaterialIcon name="print" size={18} />
                Print / save PDF
              </button>
            )}
            {onShareWhatsApp && (
              <button
                type="button"
                onClick={onShareWhatsApp}
                className="lime-btn-primary text-sm"
              >
                <MaterialIcon name="share" size={18} />
                Share on WhatsApp
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-secondary">{label}</p>
      <p className="font-semibold">{value}</p>
      {sub && <p className="text-sm text-secondary">{sub}</p>}
    </div>
  );
}

function TagSection({
  title,
  tags,
  variant,
}: {
  title: string;
  tags: string[];
  variant: 'lime' | 'amber';
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              variant === 'lime'
                ? 'border border-primary-container bg-lime/15'
                : 'border border-amber-200 bg-amber-50'
            }`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
