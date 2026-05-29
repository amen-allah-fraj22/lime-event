'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import { BookingChat } from './BookingChat';
import type { BookingDetail } from './types';
import { cn } from '@/lib/utils';

const INCLUSIONS = ['Sound System', 'Transport', 'Stage Lighting', 'MC Services'] as const;

export function ArtistBookingView({
  booking,
  meId,
  onReload,
  onSendMessage,
  onSendQuote,
}: {
  booking: BookingDetail;
  meId: string;
  onReload: () => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
  onSendQuote: (payload: {
    quote_amount: number;
    quote_conditions: Record<string, unknown>;
  }) => Promise<void>;
}) {
  const [quoteAmount, setQuoteAmount] = useState(booking.quote_amount ?? 3200);
  const [duration, setDuration] = useState('3 Hours');
  const [equipmentYes, setEquipmentYes] = useState(true);
  const [inclusions, setInclusions] = useState<string[]>(['Sound System', 'Transport']);
  const [cancellation, setCancellation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const ev = booking.event;
  const organizerName = booking.organizer.email.split('@')[0];
  const budgetLabel =
    ev.budget_min != null && ev.budget_max != null
      ? `${ev.budget_min.toLocaleString()} - ${ev.budget_max.toLocaleString()} TND`
      : 'On request';

  function toggleInclusion(item: string) {
    setInclusions((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSendQuote({
        quote_amount: quoteAmount,
        quote_conditions: {
          highlights: [
            ...inclusions,
            equipmentYes ? 'Equipment included' : 'Artist provides own equipment',
          ],
          performance: duration,
          equipment: equipmentYes ? 'Premium sound system included' : 'Standard equipment only',
          cancellation: cancellation || 'Flexible cancellation up to 7 days before event',
        },
      });
      setSent(true);
      await onReload();
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send quote');
    } finally {
      setLoading(false);
    }
  }

  const canQuote = booking.status === 'pending';

  return (
    <DashboardShell title="Booking Request Details">
      <Link
        href="/dashboard/bookings"
        className="mb-6 inline-flex items-center gap-2 font-label-md text-secondary hover:text-primary"
      >
        <MaterialIcon name="arrow_back" size={20} />
        Back to bookings
      </Link>

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="space-y-gutter lg:col-span-7">
          <div className="dashboard-shadow rounded-xl bg-white p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <span className="mb-3 inline-block rounded-full bg-primary-container/20 px-3 py-1 font-label-sm uppercase tracking-wider text-primary">
                  {booking.status === 'pending' ? 'New Request' : booking.status}
                </span>
                <h3 className="mb-2 font-headline text-headline-lg">{ev.title}</h3>
                <p className="text-secondary">Ref: BK-{booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-label-md uppercase text-secondary">Budget Range</p>
                <p className="font-headline text-headline-md font-bold text-primary">{budgetLabel}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-t border-surface-variant pt-8">
              <Detail icon="music_note" label="Event Type" value={ev.event_type} />
              <Detail
                icon="calendar_month"
                label="Date & Time"
                value={`${new Date(ev.event_date).toLocaleDateString()}${ev.start_time ? ` • ${ev.start_time}` : ''}`}
              />
              <Detail icon="location_on" label="Venue" value={ev.venue ?? ev.city ?? 'Tunisia'} />
              <Detail
                icon="groups"
                label="Expected Guests"
                value={ev.guest_count ? `${ev.guest_count} guests` : 'Not specified'}
              />
            </div>
            <div className="mt-8 rounded-lg bg-surface-container-low p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/30 font-bold text-primary">
                  {organizerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-label-sm uppercase text-secondary">Organizer</p>
                  <p className="font-bold">{organizerName}</p>
                  <p className="text-label-sm text-secondary">{booking.organizer.email}</p>
                </div>
              </div>
              {booking.message && (
                <p className="leading-relaxed text-on-surface-variant">{booking.message}</p>
              )}
            </div>
          </div>

          {booking.status === 'quoted' && booking.quote_amount != null && (
            <div className="dashboard-shadow rounded-xl border-2 border-primary-container/20 bg-white p-6">
              <h4 className="font-headline text-headline-md text-primary">Your quote was sent</h4>
              <p className="mt-2 text-2xl font-bold">{booking.quote_amount.toLocaleString()} TND</p>
              {booking.quote_expires_at && (
                <p className="mt-1 text-sm text-secondary">
                  Expires {new Date(booking.quote_expires_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {booking.contract && (
            <Link
              href={`/contracts/${booking.contract.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-6 py-3 font-bold text-on-primary-container"
            >
              View contract ({booking.contract.status})
              <MaterialIcon name="arrow_forward" />
            </Link>
          )}
        </div>

        <div className="lg:col-span-5">
          {canQuote ? (
            <div className="dashboard-shadow sticky top-24 rounded-xl border-2 border-primary-container/10 bg-white p-8">
              <h4 className="mb-6 flex items-center gap-2 font-headline text-headline-md">
                <MaterialIcon name="send" className="text-primary" />
                Send Your Quote
              </h4>
              <form onSubmit={submitQuote} className="space-y-6">
                <div>
                  <label className="mb-2 block font-label-md uppercase">Total Quote (TND)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-secondary">
                      TND
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      className="lime-input pl-16"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-label-md uppercase">Performance Duration</label>
                    <select
                      className="lime-input"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    >
                      <option>2 Hours</option>
                      <option>3 Hours</option>
                      <option>4 Hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block font-label-md uppercase">Equipment Included?</label>
                    <div className="flex h-[52px] items-center rounded-lg bg-surface-container p-1">
                      <button
                        type="button"
                        onClick={() => setEquipmentYes(true)}
                        className={cn(
                          'flex-1 rounded py-2 font-label-md',
                          equipmentYes ? 'bg-white text-primary shadow-sm' : 'text-secondary',
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEquipmentYes(false)}
                        className={cn(
                          'flex-1 rounded py-2 font-label-md',
                          !equipmentYes ? 'bg-white text-primary shadow-sm' : 'text-secondary',
                        )}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-3 block font-label-md uppercase">Service Inclusions</label>
                  <div className="grid grid-cols-2 gap-3">
                    {INCLUSIONS.map((item) => (
                      <label
                        key={item}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-surface-variant p-3 hover:bg-surface-container"
                      >
                        <input
                          type="checkbox"
                          checked={inclusions.includes(item)}
                          onChange={() => toggleInclusion(item)}
                          className="h-5 w-5 rounded border-surface-variant text-primary"
                        />
                        <span className="text-label-md">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block font-label-md uppercase">Cancellation Terms</label>
                  <textarea
                    className="lime-input min-h-[80px] resize-none"
                    rows={3}
                    placeholder="Describe your cancellation and refund terms…"
                    value={cancellation}
                    onChange={(e) => setCancellation(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || sent}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg py-4 font-bold shadow-lg transition-all',
                    sent
                      ? 'bg-green-600 text-white'
                      : 'bg-primary-container text-on-background hover:scale-[1.01] active:scale-[0.98]',
                  )}
                >
                  {loading ? (
                    <>
                      <MaterialIcon name="refresh" className="animate-spin" />
                      Sending…
                    </>
                  ) : sent ? (
                    <>
                      <MaterialIcon name="check_circle" />
                      Quote Sent Successfully
                    </>
                  ) : (
                    <>
                      Send Quote
                      <MaterialIcon name="arrow_forward" />
                    </>
                  )}
                </button>
                <p className="text-center font-label-sm text-secondary">
                  LIME service fee of 5% applies upon booking.
                </p>
              </form>
            </div>
          ) : (
            <BookingChat
              booking={booking}
              meId={meId}
              peerName={organizerName}
              onSend={onSendMessage}
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Detail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-lg bg-primary-container/10 p-2 text-primary">
        <MaterialIcon name={icon} />
      </span>
      <div>
        <p className="font-label-sm uppercase text-secondary">{label}</p>
        <p className="font-semibold capitalize">{value}</p>
      </div>
    </div>
  );
}
