'use client';

import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';

type DayStatus = 'open' | 'busy' | 'blocked' | 'booked';

const STATUS_DOT: Record<DayStatus, string> = {
  open: 'bg-primary-container',
  busy: 'bg-amber-400',
  blocked: 'bg-error',
  booked: 'bg-error',
};

/**
 * Read-only preview of the artist's next ~6 weeks. Deliberately not
 * aligned to calendar month boundaries — the API only precomputes a rolling
 * 42-day window (no titles, just status), so this shows "next 6 weeks"
 * rather than pretending to page through arbitrary months.
 */
export function AvailabilityPreviewCalendar({
  days,
}: {
  days: { date: string; status: DayStatus }[];
}) {
  if (days.length === 0) return null;

  const weekdayLabel = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { weekday: 'narrow' });

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 font-label-md font-bold text-on-surface">
          <MaterialIcon name="calendar_month" size={18} />
          Availability preview
        </h4>
        <span className="text-[11px] text-secondary">Next 6 weeks</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            {i < 7 && (
              <span className="text-[10px] uppercase text-secondary">{weekdayLabel(d.date)}</span>
            )}
            <div
              title={`${new Date(d.date).toLocaleDateString()} — ${d.status}`}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px]',
                d.status === 'open'
                  ? 'bg-primary-container/15 text-on-surface'
                  : 'bg-surface-container-highest text-secondary',
              )}
            >
              {new Date(d.date).getDate()}
            </div>
            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[d.status])} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-secondary">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-container" /> Open
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Busy
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-error" /> Booked/blocked
        </span>
      </div>
    </div>
  );
}
