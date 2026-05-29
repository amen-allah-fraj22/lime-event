'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import { useDbUser } from '@/components/providers/UserSessionProvider';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import {
  buildMonthGrid,
  entriesForDay,
  type CalendarEntry,
} from './calendar-utils';

type CalendarData = {
  bookings_as_artist: { id: string; title: string; date: string; status: string; city?: string | null }[];
  events_as_organizer: { id: string; title: string; date: string; status: string; city?: string | null }[];
  availability_blocks: { date: string; is_blocked: boolean }[];
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarPage() {
  const { user: dbUser } = useDbUser();
  const [data, setData] = useState<CalendarData | null>(null);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  useEffect(() => {
    if (!dbUser?.id) return;
    setLoading(true);
    api
      .get(`/calendar/${dbUser.id}`)
      .then((res) => setData(res.data))
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, [dbUser?.id]);

  const entries = useMemo((): CalendarEntry[] => {
    if (!data) return [];
    const list: CalendarEntry[] = [];
    for (const b of data.bookings_as_artist) {
      list.push({ ...b, kind: 'booking' });
    }
    for (const e of data.events_as_organizer) {
      list.push({ ...e, kind: 'event' });
    }
    for (const block of data.availability_blocks ?? []) {
      if (!block.is_blocked) continue;
      list.push({
        id: `block-${block.date}`,
        title: 'Blocked',
        date: block.date,
        status: 'blocked',
        kind: 'blocked',
      });
    }
    return list;
  }, [data]);

  const monthEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month && e.kind !== 'blocked';
      }),
    [entries, year, month],
  );

  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return entries
      .filter((e) => e.kind === 'booking' && new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [entries]);

  const cells = buildMonthGrid(year, month);
  const today = new Date();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  function prevMonth() {
    setCursor(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCursor(new Date(year, month + 1, 1));
  }
  function goToday() {
    setCursor(new Date());
    setSelected(new Date());
  }

  return (
    <DashboardShell title="Calendar">
      {loading && <LoadingBlock label="Loading calendar…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="font-headline text-headline-lg capitalize">{monthLabel}</h2>
                  <p className="text-body-md text-secondary">
                    {monthEntries.length} upcoming event{monthEntries.length === 1 ? '' : 's'} this month
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="rounded-full p-2 transition-colors hover:bg-surface-container"
                  >
                    <MaterialIcon name="chevron_left" />
                  </button>
                  <button
                    type="button"
                    onClick={goToday}
                    className="rounded-lg border-2 border-outline-variant px-4 py-2 font-label-md transition-colors hover:border-primary-container"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="rounded-full p-2 transition-colors hover:bg-surface-container"
                  >
                    <MaterialIcon name="chevron_right" />
                  </button>
                </div>
              </div>

              <div className="calendar-grid mb-4 border-b border-outline-variant/30 pb-4">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-label-md uppercase tracking-widest text-secondary"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="calendar-grid gap-px bg-outline-variant/20">
                {cells.map((cell, i) => {
                  if (!cell.date) return <div key={i} />;
                  const dayEntries = entriesForDay(entries, cell.date);
                  const booked = dayEntries.filter((e) => e.kind === 'booking');
                  const blocked = dayEntries.some((e) => e.kind === 'blocked');
                  const isToday = cell.inMonth && sameDayCheck(cell.date, today);
                  const isSelected = selected && sameDayCheck(cell.date, selected);

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => cell.inMonth && setSelected(cell.date)}
                      className={cn(
                        'min-h-[100px] p-2 text-left transition-colors md:min-h-[120px] md:p-3',
                        cell.inMonth
                          ? 'cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low'
                          : 'bg-surface-container-lowest text-secondary opacity-40',
                        blocked && cell.inMonth && 'bg-surface-container opacity-60',
                        isSelected && 'ring-2 ring-inset ring-primary-container',
                        isToday && cell.inMonth && !isSelected && 'ring-1 ring-inset ring-primary-container/50',
                      )}
                    >
                      <span className={cn('font-label-md', isToday && 'font-bold text-primary')}>
                        {cell.date.getDate()}
                      </span>
                      {isToday && cell.inMonth && (
                        <div className="mt-1 text-[10px] font-bold text-primary">TODAY</div>
                      )}
                      {blocked && cell.inMonth && (
                        <div className="mt-2 text-center text-[10px] font-bold uppercase text-secondary">
                          Blocked
                        </div>
                      )}
                      {booked.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="mt-2 flex items-center gap-2 rounded-md border-l-4 border-primary-container bg-primary-container/10 p-1.5"
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary-container" />
                          <span className="truncate text-[10px] font-bold text-on-primary-container">
                            {e.title}
                          </span>
                        </div>
                      ))}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-gutter lg:col-span-4">
            <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-8">
              <h3 className="mb-6 font-headline text-headline-md">Manage Availability</h3>
              <p className="mb-4 text-sm text-secondary">
                Availability blocks are created automatically when you sign contracts. Contact support to
                adjust blocked dates.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border-2 border-outline-variant bg-surface p-3">
                  <p className="text-[10px] font-bold uppercase text-secondary">From</p>
                  <p className="font-label-md">
                    {selected?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg border-2 border-outline-variant bg-surface p-3">
                  <p className="text-[10px] font-bold uppercase text-secondary">To</p>
                  <p className="font-label-md">
                    {selected?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-headline text-headline-md">Upcoming Bookings</h3>
                <span className="rounded-full bg-primary-container/20 px-3 py-1 font-label-sm font-bold text-primary">
                  {upcoming.length} total
                </span>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-sm text-secondary">No confirmed bookings on the calendar yet.</p>
              ) : (
                <div className="space-y-4">
                  {upcoming.map((b) => {
                    const d = new Date(b.date);
                    return (
                      <Link
                        key={b.id}
                        href={`/bookings/${b.id}`}
                        className="group flex gap-4 rounded-xl border border-outline-variant/30 p-4 transition-all hover:border-primary-container"
                      >
                        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-surface-container text-center">
                          <span className="text-label-sm font-bold uppercase text-secondary">
                            {d.toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                          <span className="font-headline text-headline-md font-bold">{d.getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-bold">{b.title}</h4>
                          <p className="mt-1 flex items-center gap-1 text-label-sm text-secondary">
                            <MaterialIcon name="location_on" size={16} />
                            {b.city ?? 'Tunisia'}
                          </p>
                        </div>
                        <MaterialIcon
                          name="chevron_right"
                          className="text-secondary transition-colors group-hover:text-primary"
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
              <Link
                href="/dashboard/bookings"
                className="mt-6 block w-full py-2 text-center font-label-md font-bold text-primary hover:underline"
              >
                View all bookings
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function sameDayCheck(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
