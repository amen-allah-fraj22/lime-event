'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

const CITIES = ['Tunis', 'Sousse', 'Hammamet', 'Djerba'] as const;

const EVENT_TYPE_OPTIONS = [
  { value: 'festival', label: 'Concert', icon: 'nightlife' },
  { value: 'private', label: 'Private', icon: 'celebration' },
  { value: 'corporate', label: 'Corporate', icon: 'business_center' },
] as const;

const STYLE_TAG_OPTIONS = [
  'Energetic',
  'Elegant',
  'Traditional',
  'Acoustic',
  'Modern',
  'VIP Lounge',
] as const;

const STEP_LABELS = ['Basics', 'Requirements', 'Review', 'Success'];
const TOTAL_STEPS = 4;

type EventTypeValue = (typeof EVENT_TYPE_OPTIONS)[number]['value'];

export type EventWizardForm = {
  title: string;
  eventType: EventTypeValue;
  city: string;
  venue: string;
  eventDate: string;
  startTime: string;
  durationHours: number;
  guestCount: number;
  budgetMin: number;
  budgetMax: number;
  styleTags: string[];
};

const defaultForm: EventWizardForm = {
  title: '',
  eventType: 'festival',
  city: 'Tunis',
  venue: '',
  eventDate: '',
  startTime: '20:00',
  durationHours: 4,
  guestCount: 250,
  budgetMin: 1500,
  budgetMax: 5000,
  styleTags: ['Elegant'],
};

export function CreateEventWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<EventWizardForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState(0);

  const progress = (step / TOTAL_STEPS) * 100;

  const eventTypeLabel = useMemo(
    () => EVENT_TYPE_OPTIONS.find((o) => o.value === form.eventType)?.label ?? form.eventType,
    [form.eventType],
  );

  function patch<K extends keyof EventWizardForm>(key: K, value: EventWizardForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleStyleTag(tag: string) {
    setForm((f) => ({
      ...f,
      styleTags: f.styleTags.includes(tag)
        ? f.styleTags.filter((t) => t !== tag)
        : [...f.styleTags, tag],
    }));
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.title.trim()) return 'Event name is required.';
      if (!form.eventDate) return 'Event date is required.';
    }
    if (step === 2) {
      if (form.budgetMin > form.budgetMax) return 'Minimum budget cannot exceed maximum.';
      if (form.styleTags.length === 0) return 'Select at least one style tag.';
    }
    return null;
  }

  async function finalize() {
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post('/events', {
        title: form.title.trim(),
        event_type: form.eventType,
        city: form.city,
        venue: form.venue.trim() || undefined,
        event_date: form.eventDate,
        start_time: form.startTime || undefined,
        duration_hours: form.durationHours,
        guest_count: form.guestCount,
        budget_min: form.budgetMin,
        budget_max: form.budgetMax,
        style_tags: form.styleTags.map((t) => t.toLowerCase()),
      });
      const eventId = res.data.id as string;
      setCreatedEventId(eventId);
      const matchesRes = await api.get(`/events/${eventId}/matches`);
      setMatchCount(Array.isArray(matchesRes.data) ? matchesRes.data.length : 0);
      setStep(4);
    } catch (err) {
      setError(getApiErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    if (step === 3) {
      void finalize();
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <DashboardShell title="New Event" showNewEvent={false}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-12">
          <div className="mb-4 flex justify-between">
            <span className="font-label-md uppercase tracking-widest text-primary">
              Step {step}: {STEP_LABELS[step - 1]}
            </span>
            <span className="font-label-md text-secondary">
              {step} of {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full bg-primary-container transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {step === 1 && (
          <section className="step-transition space-y-8">
            <div>
              <h3 className="mb-2 font-headline text-headline-lg">Tell us about the event</h3>
              <p className="text-body-lg text-secondary">
                Every great experience starts with a vision. Let&apos;s define the basics.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="mb-2 block font-label-md uppercase text-on-background">
                  Event Name
                </label>
                <input
                  className="lime-input"
                  placeholder="e.g. Moonlight Jazz Night 2024"
                  value={form.title}
                  onChange={(e) => patch('title', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block font-label-md uppercase text-on-background">
                  Event Type
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {EVENT_TYPE_OPTIONS.map((opt) => {
                    const selected = form.eventType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => patch('eventType', opt.value)}
                        className={cn(
                          'flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all group',
                          selected
                            ? 'border-primary-container bg-primary-container/10'
                            : 'border-surface-variant bg-white hover:border-primary-container',
                        )}
                      >
                        <MaterialIcon
                          name={opt.icon}
                          className={selected ? 'text-primary' : 'text-secondary'}
                        />
                        <span className="font-label-md">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-label-md uppercase text-on-background">City</label>
                  <select
                    className="lime-input"
                    value={form.city}
                    onChange={(e) => patch('city', e.target.value)}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block font-label-md uppercase text-on-background">Venue</label>
                  <input
                    className="lime-input"
                    placeholder="Hotel, Club, or Private Hall"
                    value={form.venue}
                    onChange={(e) => patch('venue', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block font-label-md uppercase text-on-background">Date</label>
                  <input
                    type="date"
                    className="lime-input"
                    value={form.eventDate}
                    onChange={(e) => patch('eventDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block font-label-md uppercase text-on-background">Time</label>
                  <input
                    type="time"
                    className="lime-input"
                    value={form.startTime}
                    onChange={(e) => patch('startTime', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block font-label-md uppercase text-on-background">
                    Duration (Hrs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="lime-input"
                    value={form.durationHours}
                    onChange={(e) => patch('durationHours', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="step-transition space-y-8">
            <div>
              <h3 className="mb-2 font-headline text-headline-lg">Talent Requirements</h3>
              <p className="text-body-lg text-secondary">
                Define the audience and the atmosphere you want to create.
              </p>
            </div>
            <div className="space-y-10">
              <div className="dashboard-shadow rounded-2xl bg-white p-6">
                <div className="mb-4 flex justify-between">
                  <label className="font-label-md uppercase text-on-background">Expected Guests</label>
                  <span className="font-bold text-primary">{form.guestCount} Guests</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={5000}
                  step={10}
                  value={form.guestCount}
                  onChange={(e) => patch('guestCount', Number(e.target.value))}
                  className="custom-range w-full cursor-pointer appearance-none rounded-lg bg-surface-container"
                />
                <div className="mt-2 flex justify-between text-label-sm text-secondary">
                  <span>10</span>
                  <span>5000+</span>
                </div>
              </div>
              <div className="dashboard-shadow rounded-2xl bg-white p-6">
                <label className="mb-6 block font-label-md uppercase text-on-background">
                  Budget Range (TND)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">Min</span>
                    <input
                      type="number"
                      className="w-full rounded-xl border-none bg-surface-container-low py-3 pl-14 pr-4 font-bold text-primary outline-none"
                      value={form.budgetMin}
                      onChange={(e) => patch('budgetMin', Number(e.target.value))}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">Max</span>
                    <input
                      type="number"
                      className="w-full rounded-xl border-none bg-surface-container-low py-3 pl-14 pr-4 font-bold text-primary outline-none"
                      value={form.budgetMax}
                      onChange={(e) => patch('budgetMax', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-4 block font-label-md uppercase text-on-background">
                  Event Style &amp; Vibe
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_TAG_OPTIONS.map((tag) => {
                    const on = form.styleTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleStyleTag(tag)}
                        className={cn(
                          'rounded-full border-2 px-4 py-2 text-label-md transition-all',
                          on
                            ? 'border-primary-container bg-primary-container/10 font-bold text-primary'
                            : 'border-surface-variant bg-white hover:border-primary-container',
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="step-transition space-y-8">
            <div>
              <h3 className="mb-2 font-headline text-headline-lg">Review Summary</h3>
              <p className="text-body-lg text-secondary">
                Final check before we match you with the best talent in Tunisia.
              </p>
            </div>
            <div className="dashboard-shadow overflow-hidden rounded-2xl bg-white">
              <div className="border-b border-primary-container/20 bg-primary-container/10 p-6">
                <h4 className="font-headline text-headline-md text-primary">{form.title || 'Untitled event'}</h4>
                <p className="text-secondary">
                  {form.city} • {eventTypeLabel}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-8 p-8 sm:grid-cols-2">
                <SummaryRow icon="calendar_month" label="Date & Time" value={`${form.eventDate || '—'} • ${form.startTime}`} />
                <SummaryRow icon="location_on" label="Venue" value={form.venue || 'TBD'} />
                <SummaryRow icon="group" label="Scale" value={`${form.guestCount} Guests`} />
                <SummaryRow
                  icon="payments"
                  label="Budget"
                  value={`${form.budgetMin.toLocaleString()} - ${form.budgetMax.toLocaleString()} TND`}
                />
              </div>
              <div className="border-t border-surface p-8">
                <p className="mb-4 text-label-sm uppercase text-secondary">Atmosphere Tags</p>
                <div className="flex flex-wrap gap-2">
                  {form.styleTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface px-3 py-1 text-label-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="step-transition py-12 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-primary">
              <MaterialIcon name="check_circle" size={40} filled />
            </div>
            <h3 className="mb-2 font-headline text-headline-xl">Matches Ready!</h3>
            <p className="mb-12 text-body-lg text-secondary">
              We&apos;ve found {matchCount} artist{matchCount === 1 ? '' : 's'} that fit your event criteria.
            </p>
            <div className="mx-auto max-w-lg space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
                >
                  <div className="h-16 w-16 shrink-0 rounded-lg shimmer" />
                  <div className="flex-1 space-y-2 text-left">
                    <div className="h-4 w-3/4 rounded shimmer" />
                    <div className="h-3 w-1/2 rounded shimmer" />
                  </div>
                  <div className="h-8 w-20 shrink-0 rounded-full shimmer" />
                </div>
              ))}
            </div>
            {createdEventId && (
              <Link
                href={`/events/${createdEventId}/matches`}
                className="mx-auto mt-12 inline-flex items-center gap-2 rounded-xl bg-primary-container px-8 py-4 font-bold text-on-primary-container transition-all hover:scale-105 active:scale-[0.98]"
              >
                View Matched Artists
                <MaterialIcon name="arrow_forward" />
              </Link>
            )}
          </section>
        )}

        {step < 4 && (
          <div className="mt-16 flex items-center justify-between border-t border-outline-variant pt-8">
            <button
              type="button"
              onClick={back}
              className={cn(
                'flex items-center gap-2 px-6 py-3 font-bold text-secondary transition-colors hover:text-primary',
                step === 1 && 'invisible',
              )}
            >
              <MaterialIcon name="arrow_back" />
              Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary-container px-10 py-3 font-bold text-on-primary-container transition-all hover:scale-105 active:scale-[0.98] disabled:opacity-60"
            >
              {step === 3 ? (
                <>
                  {submitting ? 'Creating…' : 'Finalize'}
                  <MaterialIcon name="check" />
                </>
              ) : (
                <>
                  Next
                  <MaterialIcon name="arrow_forward" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="rounded-lg bg-surface p-2 text-primary">
        <MaterialIcon name={icon} />
      </span>
      <div>
        <p className="text-label-sm uppercase text-secondary">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}
