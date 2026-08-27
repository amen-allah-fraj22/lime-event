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
import { CalendarManageSidebar } from './CalendarManageSidebar';

type CalendarData = {
  bookings_as_artist: { id: string; title: string; date: string; status: string; city?: string | null }[];
  events_as_organizer: {
    id: string;
    title: string;
    date: string;
    status: string;
    city?: string | null;
    is_confirmed?: boolean;
  }[];
  manual_events?: { id: string; title: string; date: string; start_time?: string; end_time?: string }[];
  day_overrides?: { date: string; status: 'OPEN' | 'WARN' | 'BLOCKED' }[];
  google_events?: { id: string; title: string; date: string; end_date?: string }[];
  google_connected?: boolean;
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

  const fetchCalendar = () => {
    if (!dbUser?.id) return;
    setLoading(true);
    api
      .get(`/calendar/${dbUser.id}`)
      .then((res) => setData(res.data))
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCalendar();
    // Intentionally keyed on the user id alone. fetchCalendar is redefined on
    // every render, so listing it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUser?.id]);

  const entries = useMemo((): CalendarEntry[] => {
    if (!data) return [];
    const list: CalendarEntry[] = [];
    for (const b of data.bookings_as_artist) {
      list.push({ ...b, kind: 'booking' });
    }
    for (const e of data.events_as_organizer) {
      list.push({ ...e, kind: 'event', is_confirmed: e.is_confirmed });
    }
    for (const event of data.manual_events ?? []) {
      list.push({
        id: `manual-${event.id}`,
        title: event.title,
        date: event.date,
        status: 'manual',
        kind: 'manual_event',
      });
    }
    for (const ge of data.google_events ?? []) {
      list.push({
        id: `google-${ge.id}`,
        title: ge.title,
        date: ge.date,
        status: 'google',
        kind: 'google_event',
      });
    }
    for (const override of data.day_overrides ?? []) {
      if (override.status === 'OPEN') continue;
      list.push({
        id: `override-${override.date}`,
        title: override.status === 'BLOCKED' ? 'Blocked' : 'Busy',
        date: override.date,
        status: override.status,
        kind: override.status === 'BLOCKED' ? 'override_blocked' : 'override_warn',
      });
    }
    return list;
  }, [data]);

  const monthEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month && !e.kind.startsWith('override_');
      }),
    [entries, year, month],
  );

  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return entries
      .filter(
        (e) =>
          (e.kind === 'booking' || (e.kind === 'event' && e.is_confirmed)) &&
          new Date(e.date) >= now,
      )
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

  const blockedThisMonth = (data?.day_overrides ?? []).filter((o) => {
    if (o.status !== 'BLOCKED') return false;
    const d = new Date(o.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
  const nextGig = upcoming[0];

  // Mobile week strip: anchored on the selected day (or today), independent
  // of the desktop month cursor so tapping a day doesn't jump the header.
  const weekAnchor = selected ?? today;
  const weekStart = new Date(weekAnchor);
  weekStart.setDate(weekAnchor.getDate() - ((weekAnchor.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  function selectMobileDay(d: Date) {
    setSelected(d);
    if (d.getFullYear() !== year || d.getMonth() !== month) {
      setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }
  function shiftWeek(days: number) {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + days);
    selectMobileDay(d);
  }

  return (
    <DashboardShell title="Calendar">
      {loading && <LoadingBlock label="Loading calendar…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <div className="lg:col-span-8">
            {/* Mobile: compact week strip instead of the full month grid */}
            <div className="dashboard-shadow mb-gutter rounded-xl bg-surface-container-lowest p-4 md:hidden">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-headline text-headline-md">
                  {weekAnchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => shiftWeek(-7)}
                    aria-label="Previous week"
                    className="rounded-full p-1.5 transition-colors hover:bg-surface-container"
                  >
                    <MaterialIcon name="chevron_left" size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={goToday}
                    className="rounded-lg border border-outline-variant px-2.5 py-1 text-label-sm transition-colors hover:border-primary-container"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => shiftWeek(7)}
                    aria-label="Next week"
                    className="rounded-full p-1.5 transition-colors hover:bg-surface-container"
                  >
                    <MaterialIcon name="chevron_right" size={20} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((d) => {
                  const dayEntries = entriesForDay(entries, d);
                  const blocked = dayEntries.some((e) => e.kind === 'override_blocked');
                  const warn = dayEntries.some((e) => e.kind === 'override_warn');
                  const hasEvents = dayEntries.some(
                    (e) => e.kind === 'booking' || e.kind === 'manual_event' || e.kind === 'google_event' || (e.kind === 'event' && e.is_confirmed),
                  );
                  const isToday = sameDayCheck(d, today);
                  const isSelected = selected && sameDayCheck(d, selected);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => selectMobileDay(d)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border-2 py-2 transition-all',
                        isSelected
                          ? 'border-primary-container bg-primary-container/10'
                          : 'border-transparent hover:bg-surface-container-low',
                      )}
                    >
                      <span className="text-[10px] uppercase text-secondary">
                        {d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
                      </span>
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full font-label-md',
                          isToday && 'bg-primary text-on-primary font-bold',
                          !isToday && blocked && 'bg-error-container text-error',
                          !isToday && !blocked && warn && 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {d.getDate()}
                      </span>
                      <span
                        className={cn(
                          'h-1 w-1 rounded-full',
                          hasEvents ? 'bg-primary-container' : 'bg-transparent',
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop: full month grid */}
            <div className="dashboard-shadow hidden rounded-xl bg-surface-container-lowest p-8 md:block">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-headline text-headline-lg capitalize">{monthLabel}</h2>
                  <p className="text-body-md text-secondary">Manage your availability and upcoming gigs.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevMonth}
                    aria-label="Previous month"
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
                    aria-label="Next month"
                    className="rounded-full p-2 transition-colors hover:bg-surface-container"
                  >
                    <MaterialIcon name="chevron_right" />
                  </button>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <div className="flex items-center gap-2 rounded-full border border-surface-container-highest bg-surface-container-lowest px-4 py-2 shadow-[0px_2px_10px_rgba(0,0,0,0.02)]">
                  <span className="h-2 w-2 rounded-full bg-primary-container" />
                  <span className="text-label-sm">
                    {monthEntries.length} event{monthEntries.length === 1 ? '' : 's'} this month
                  </span>
                </div>
                {nextGig && (
                  <div className="flex items-center gap-2 rounded-full border border-surface-container-highest bg-surface-container-lowest px-4 py-2 shadow-[0px_2px_10px_rgba(0,0,0,0.02)]">
                    <MaterialIcon name="event" size={16} className="text-secondary" />
                    <span className="text-label-sm">
                      Next gig: {new Date(nextGig.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                {blockedThisMonth > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-error-container bg-surface-container-lowest px-4 py-2 shadow-[0px_2px_10px_rgba(0,0,0,0.02)]">
                    <span className="h-2 w-2 rounded-full bg-error" />
                    <span className="text-label-sm">
                      {blockedThisMonth} blocked day{blockedThisMonth === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
              </div>

              <div className="calendar-grid mb-2 border-b border-outline-variant/30 pb-4">
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
                  const booked = dayEntries.filter(
                    (e) => e.kind === 'booking' || (e.kind === 'event' && e.is_confirmed),
                  );
                  const manual = dayEntries.filter((e) => e.kind === 'manual_event');
                  const google = dayEntries.filter((e) => e.kind === 'google_event');
                  const displayEvents = [...booked, ...manual, ...google];
                  const blocked = dayEntries.some((e) => e.kind === 'override_blocked');
                  const warn = dayEntries.some((e) => e.kind === 'override_warn');
                  const isToday = cell.inMonth && sameDayCheck(cell.date, today);
                  const isSelected = selected && sameDayCheck(cell.date, selected);

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => cell.inMonth && setSelected(cell.date)}
                      className={cn(
                        'min-h-[100px] p-2 text-left transition-all duration-150 md:min-h-[120px] md:p-3',
                        cell.inMonth
                          ? 'cursor-pointer bg-surface-container-lowest hover:-translate-y-px hover:shadow-[0px_4px_12px_rgba(0,0,0,0.06)]'
                          : 'bg-surface-container-lowest text-secondary opacity-40',
                        blocked && cell.inMonth && 'bg-error-container/20',
                        !blocked && warn && cell.inMonth && 'bg-amber-400/10',
                        isSelected && 'ring-2 ring-inset ring-primary-container',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full font-label-md',
                          isToday && 'bg-primary-container font-bold text-on-primary-container',
                        )}
                      >
                        {cell.date.getDate()}
                      </span>
                      {blocked && cell.inMonth && (
                        <div className="mt-1.5 text-[10px] font-bold uppercase text-error">Blocked</div>
                      )}
                      {!blocked && warn && cell.inMonth && (
                        <div className="mt-1.5 text-[10px] font-bold uppercase text-amber-600">Busy</div>
                      )}
                      {displayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className={cn(
                            "mt-1.5 flex items-center gap-1.5 truncate rounded-md border-l-4 bg-surface-container-lowest p-1.5 shadow-sm",
                            e.kind === 'manual_event'
                              ? "border-amber-400"
                              : e.kind === 'google_event'
                              ? "border-blue-400"
                              : "border-primary-container"
                          )}
                        >
                          <span className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            e.kind === 'manual_event' ? "bg-amber-400" : e.kind === 'google_event' ? 'bg-blue-400' : "bg-primary-container"
                          )} />
                          <span className="truncate text-[10px] font-bold text-on-surface">
                            {e.title}
                          </span>
                        </div>
                      ))}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="text-label-sm text-secondary">Legend:</span>
                <span className="flex items-center gap-1.5 text-[11px] text-secondary">
                  <span className="h-3 w-3 rounded-sm border border-primary-container bg-primary-container/20" /> Open
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-secondary">
                  <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-400/10" /> Busy
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-secondary">
                  <span className="h-3 w-3 rounded-sm border border-error-container bg-error-container/40" /> Blocked
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Google Sync
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-gutter lg:col-span-4">
            <CalendarManageSidebar
              userId={dbUser?.id ?? ''}
              selectedDate={selected}
              entriesForSelectedDate={selected ? entriesForDay(entries, selected) : []}
              onRefresh={fetchCalendar}
              googleConnected={data?.google_connected}
            />

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
