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
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Drag-to-select a date range on the desktop month grid.
  const [dragAnchor, setDragAnchor] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rangeBusy, setRangeBusy] = useState(false);

  // Bulk quick-actions menu (Block weekends / Copy last month).
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [mobileBulkSheetOpen, setMobileBulkSheetOpen] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const fetchCalendar = (opts?: { silent?: boolean }) => {
    if (!dbUser?.id) return;
    if (opts?.silent) setRefreshing(true);
    else setLoading(true);
    api
      .get(`/calendar/${dbUser.id}`)
      .then((res) => {
        setData(res.data);
        setLastRefreshedAt(new Date());
        setError(null);
      })
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchCalendar();
    // Intentionally keyed on the user id alone. fetchCalendar is redefined on
    // every render, so listing it here would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUser?.id]);

  // End a drag-select on mouseup anywhere, not just over a cell — otherwise
  // releasing past the grid edge would leave isDragging stuck true.
  useEffect(() => {
    if (!isDragging) return;
    const stop = () => setIsDragging(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, [isDragging]);

  const rangeDates = useMemo(() => {
    if (!dragAnchor || !dragEnd) return [];
    const start = dragAnchor < dragEnd ? dragAnchor : dragEnd;
    const end = dragAnchor < dragEnd ? dragEnd : dragAnchor;
    const out: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      out.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [dragAnchor, dragEnd]);

  function startDrag(d: Date) {
    setDragAnchor(d);
    setDragEnd(d);
    setIsDragging(true);
    setSelected(null);
  }
  function extendDrag(d: Date) {
    if (isDragging) setDragEnd(d);
  }
  function clearRange() {
    setDragAnchor(null);
    setDragEnd(null);
  }
  async function applyRangeStatus(status: 'OPEN' | 'WARN' | 'BLOCKED') {
    if (!dbUser?.id || rangeDates.length === 0) return;
    setRangeBusy(true);
    try {
      await api.post(`/calendar/${dbUser.id}/day-overrides/bulk`, {
        dates: rangeDates.map((d) => toDateStr(d)),
        status,
      });
      clearRange();
      fetchCalendar({ silent: true });
    } catch (e) {
      setBulkError(getApiErrorMessage(e).message);
    } finally {
      setRangeBusy(false);
    }
  }

  async function blockWeekendsThisMonth() {
    if (!dbUser?.id) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const weekendDates: string[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        if (d.getDay() === 0 || d.getDay() === 6) weekendDates.push(toDateStr(d));
      }
      await api.post(`/calendar/${dbUser.id}/day-overrides/bulk`, {
        dates: weekendDates,
        status: 'BLOCKED',
      });
      setBulkMenuOpen(false);
      fetchCalendar({ silent: true });
    } catch (e) {
      setBulkError(getApiErrorMessage(e).message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function copyLastMonthAvailability() {
    if (!dbUser?.id) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      const prevMonthDate = new Date(year, month - 1, 1);
      const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
      const res = await api.get(`/calendar/${dbUser.id}/day-overrides/month/${prevMonthStr}`);
      const overrides = res.data as { date: string; status: 'OPEN' | 'WARN' | 'BLOCKED' }[];
      const daysInThisMonth = new Date(year, month + 1, 0).getDate();

      const byStatus: Record<'WARN' | 'BLOCKED', string[]> = { WARN: [], BLOCKED: [] };
      for (const o of overrides) {
        if (o.status === 'OPEN') continue;
        const dayOfMonth = Number(o.date.slice(-2));
        if (dayOfMonth > daysInThisMonth) continue;
        byStatus[o.status].push(toDateStr(new Date(year, month, dayOfMonth)));
      }

      for (const status of ['WARN', 'BLOCKED'] as const) {
        if (byStatus[status].length > 0) {
          await api.post(`/calendar/${dbUser.id}/day-overrides/bulk`, {
            dates: byStatus[status],
            status,
          });
        }
      }
      setBulkMenuOpen(false);
      fetchCalendar({ silent: true });
    } catch (e) {
      setBulkError(getApiErrorMessage(e).message);
    } finally {
      setBulkBusy(false);
    }
  }

  /** Reverts every blocked/busy day this month back to Open. Never touches
   * real bookings/events — only the manual day-status overrides. */
  async function clearBlocksThisMonth() {
    if (!dbUser?.id) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      const dates = (data?.day_overrides ?? [])
        .filter((o) => {
          if (o.status === 'OPEN') return false;
          const d = new Date(o.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .map((o) => o.date);
      if (dates.length > 0) {
        await api.post(`/calendar/${dbUser.id}/day-overrides/bulk`, { dates, status: 'OPEN' });
      }
      setBulkMenuOpen(false);
      fetchCalendar({ silent: true });
    } catch (e) {
      setBulkError(getApiErrorMessage(e).message);
    } finally {
      setBulkBusy(false);
    }
  }

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
  const overridesThisMonth = (data?.day_overrides ?? []).filter((o) => {
    if (o.status === 'OPEN') return false;
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
              <div className="mb-1 flex items-center justify-between">
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
                  <button
                    type="button"
                    onClick={() => setMobileBulkSheetOpen(true)}
                    aria-label="Bulk actions"
                    className="rounded-full p-1.5 transition-colors hover:bg-surface-container"
                  >
                    <MaterialIcon name="more_vert" size={20} />
                  </button>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] text-secondary w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                {lastRefreshedAt && <span>Synced {timeAgoLabel(lastRefreshedAt)}</span>}
                <button
                  type="button"
                  onClick={() => fetchCalendar({ silent: true })}
                  disabled={refreshing}
                  aria-label="Refresh calendar"
                  className="rounded-full p-0.5 transition-colors hover:bg-surface-container-highest disabled:opacity-50"
                >
                  <MaterialIcon name="refresh" size={12} className={cn(refreshing && 'animate-spin')} />
                </button>
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

              {selected && (() => {
                const dayEntries = entriesForDay(entries, selected);
                const blocked = dayEntries.some((e) => e.kind === 'override_blocked');
                const warn = dayEntries.some((e) => e.kind === 'override_warn');
                const displayable = dayEntries.filter((e) => !e.kind.startsWith('override_'));
                return (
                  <div className="mt-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-headline text-sm font-bold text-on-surface">
                        {selected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                          blocked
                            ? 'bg-error-container text-error'
                            : warn
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-primary-container/20 text-primary',
                        )}
                      >
                        {blocked ? 'Blocked' : warn ? 'Busy' : 'Open'}
                      </span>
                    </div>
                    {displayable.length === 0 ? (
                      <p className="text-xs text-secondary">No events this day.</p>
                    ) : (
                      <div className="space-y-2">
                        {displayable.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className={cn(
                              'rounded-lg border-l-4 bg-surface-container-lowest px-2.5 py-2',
                              e.kind === 'manual_event'
                                ? 'border-amber-400'
                                : e.kind === 'google_event'
                                  ? 'border-blue-400'
                                  : 'border-primary-container',
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-bold text-on-surface">{e.title}</p>
                              <span className="shrink-0 text-[9px] font-bold uppercase text-secondary">
                                {e.kind === 'manual_event'
                                  ? 'Personal'
                                  : e.kind === 'google_event'
                                    ? 'Google'
                                    : e.kind === 'event' && e.is_confirmed
                                      ? 'Confirmed'
                                      : e.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {displayable.length > 3 && (
                          <p className="text-[11px] text-secondary">+{displayable.length - 3} more</p>
                        )}
                      </div>
                    )}
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                      Manage this day below <MaterialIcon name="arrow_downward" size={12} />
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Desktop: full month grid */}
            <div className="dashboard-shadow hidden rounded-xl bg-surface-container-lowest p-8 md:block">
              <div className="mb-2 flex items-center justify-between">
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
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBulkMenuOpen((v) => !v)}
                      aria-label="Bulk actions"
                      className="rounded-full p-2 transition-colors hover:bg-surface-container"
                    >
                      <MaterialIcon name="more_vert" />
                    </button>
                    {bulkMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setBulkMenuOpen(false)} />
                        <div className="dashboard-shadow absolute right-0 top-11 z-50 w-64 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-2">
                          <button
                            type="button"
                            disabled={bulkBusy}
                            onClick={blockWeekendsThisMonth}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface-container-low disabled:opacity-50"
                          >
                            <MaterialIcon name="weekend" size={18} className="text-secondary" />
                            Block all weekends this month
                          </button>
                          <button
                            type="button"
                            disabled={bulkBusy}
                            onClick={copyLastMonthAvailability}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface-container-low disabled:opacity-50"
                          >
                            <MaterialIcon name="content_copy" size={18} className="text-secondary" />
                            Copy last month&apos;s availability
                          </button>
                          <div className="my-1 border-t border-outline-variant/40" />
                          <button
                            type="button"
                            disabled={bulkBusy || overridesThisMonth === 0}
                            onClick={clearBlocksThisMonth}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-error hover:bg-error-container/20 disabled:opacity-50"
                          >
                            <MaterialIcon name="delete_sweep" size={18} />
                            Clear all blocks this month
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                  {lastRefreshedAt && <span>Synced {timeAgoLabel(lastRefreshedAt)}</span>}
                  <button
                    type="button"
                    onClick={() => fetchCalendar({ silent: true })}
                    disabled={refreshing}
                    aria-label="Refresh calendar"
                    className="rounded-full p-0.5 transition-colors hover:bg-surface-container-highest disabled:opacity-50"
                  >
                    <MaterialIcon
                      name="refresh"
                      size={14}
                      className={cn(refreshing && 'animate-spin')}
                    />
                  </button>
                </div>
                {bulkError && <span className="text-xs text-error">{bulkError}</span>}
              </div>

              {rangeDates.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-container bg-primary-container/10 px-4 py-3">
                  <span className="text-sm font-semibold">
                    {rangeDates.length} day{rangeDates.length === 1 ? '' : 's'} selected
                    {rangeDates.length > 1 &&
                      ` (${rangeDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${rangeDates[rangeDates.length - 1].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={rangeBusy}
                      onClick={() => applyRangeStatus('OPEN')}
                      className="rounded-lg bg-primary-container px-3 py-1.5 text-xs font-bold text-on-primary-fixed disabled:opacity-50"
                    >
                      Mark Open
                    </button>
                    <button
                      type="button"
                      disabled={rangeBusy}
                      onClick={() => applyRangeStatus('WARN')}
                      className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-950 disabled:opacity-50"
                    >
                      Mark Busy
                    </button>
                    <button
                      type="button"
                      disabled={rangeBusy}
                      onClick={() => applyRangeStatus('BLOCKED')}
                      className="rounded-lg bg-error px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Mark Blocked
                    </button>
                    <button
                      type="button"
                      disabled={rangeBusy}
                      onClick={clearRange}
                      className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

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
                  const isInRange =
                    cell.inMonth &&
                    rangeDates.some((d) => sameDayCheck(d, cell.date as Date));

                  return (
                    <button
                      key={i}
                      type="button"
                      className={cn(
                        'group relative min-h-[100px] p-2 text-left transition-all duration-150 md:min-h-[120px] md:p-3',
                        cell.inMonth
                          ? 'cursor-pointer bg-surface-container-lowest hover:-translate-y-px hover:z-10 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.06)]'
                          : 'bg-surface-container-lowest text-secondary opacity-40',
                        blocked && cell.inMonth && 'bg-error-container/20',
                        !blocked && warn && cell.inMonth && 'bg-amber-400/10',
                        isSelected && 'ring-2 ring-inset ring-primary-container',
                        isInRange && 'bg-primary-container/20 ring-1 ring-inset ring-primary-container/60',
                      )}
                      onMouseDown={(evt) => {
                        if (!cell.inMonth) return;
                        evt.preventDefault();
                        startDrag(cell.date as Date);
                      }}
                      onMouseEnter={() => cell.inMonth && extendDrag(cell.date as Date)}
                      onClick={() => {
                        // A drag that never left its start cell is just a click.
                        if (cell.inMonth && rangeDates.length <= 1) setSelected(cell.date);
                      }}
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
                      {cell.inMonth && dayEntries.length > 0 && (
                        <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="font-headline text-sm font-bold text-on-surface">
                              {cell.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                blocked
                                  ? 'bg-error-container text-error'
                                  : warn
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-primary-container/20 text-primary',
                              )}
                            >
                              {blocked ? 'Blocked' : warn ? 'Busy' : 'Open'}
                            </span>
                          </div>
                          {displayEvents.length === 0 ? (
                            <p className="text-xs text-secondary">No events this day.</p>
                          ) : (
                            <div className="space-y-2">
                              {displayEvents.slice(0, 3).map((e) => (
                                <div
                                  key={e.id}
                                  className={cn(
                                    'rounded-lg border-l-4 bg-surface-container-low px-2.5 py-2',
                                    e.kind === 'manual_event'
                                      ? 'border-amber-400'
                                      : e.kind === 'google_event'
                                        ? 'border-blue-400'
                                        : 'border-primary-container',
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-bold text-on-surface">{e.title}</p>
                                    <span className="shrink-0 text-[9px] font-bold uppercase text-secondary">
                                      {e.kind === 'manual_event'
                                        ? 'Personal'
                                        : e.kind === 'google_event'
                                          ? 'Google'
                                          : e.kind === 'event' && e.is_confirmed
                                            ? 'Confirmed'
                                            : e.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {displayEvents.length > 3 && (
                                <p className="text-[11px] text-secondary">+{displayEvents.length - 3} more</p>
                              )}
                            </div>
                          )}
                          <p className="mt-3 text-[11px] font-semibold text-primary">Click to manage this day →</p>
                        </div>
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

      {mobileBulkSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileBulkSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface-container-lowest p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-outline-variant" />
            {bulkError && <p className="mb-2 text-sm text-error">{bulkError}</p>}
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => {
                blockWeekendsThisMonth();
                setMobileBulkSheetOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-sm font-semibold hover:bg-surface-container-low disabled:opacity-50"
            >
              <MaterialIcon name="weekend" className="text-secondary" />
              Block all weekends this month
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => {
                copyLastMonthAvailability();
                setMobileBulkSheetOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-sm font-semibold hover:bg-surface-container-low disabled:opacity-50"
            >
              <MaterialIcon name="content_copy" className="text-secondary" />
              Copy last month&apos;s availability
            </button>
            <button
              type="button"
              disabled={bulkBusy || overridesThisMonth === 0}
              onClick={() => {
                clearBlocksThisMonth();
                setMobileBulkSheetOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-sm font-semibold text-error hover:bg-error-container/20 disabled:opacity-50"
            >
              <MaterialIcon name="delete_sweep" />
              Clear all blocks this month
            </button>
            <button
              type="button"
              onClick={() => setMobileBulkSheetOpen(false)}
              className="mt-2 w-full rounded-xl border border-outline-variant px-4 py-3 text-center text-sm font-semibold"
            >
              Cancel
            </button>
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

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function timeAgoLabel(then: Date): string {
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
