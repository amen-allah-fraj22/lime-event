'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';
import type { CalendarEntry } from './calendar-utils';
import { DayStatusModal } from './DayStatusModal';
import { CalendarSyncButton } from './CalendarSyncButton';

const STATUS_META = {
  OPEN: {
    label: 'Open',
    desc: 'Available for requests',
    dot: 'bg-primary',
    active: 'bg-primary-container text-on-primary-container',
  },
  WARN: {
    label: 'Busy',
    desc: 'Warn organizers, allow requests',
    dot: 'bg-amber-400',
    active: 'bg-amber-400/20 text-amber-800',
  },
  BLOCKED: {
    label: 'Blocked',
    desc: 'No requests allowed',
    dot: 'bg-error',
    active: 'bg-error-container text-error',
  },
} as const;

export function CalendarManageSidebar({
  userId,
  selectedDate,
  entriesForSelectedDate,
  onRefresh,
  googleConnected,
}: {
  userId: string;
  selectedDate: Date | null;
  entriesForSelectedDate: CalendarEntry[];
  onRefresh: () => void;
  googleConnected?: boolean;
}) {
  const [savingStatus, setSavingStatus] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [showDayStatusModal, setShowDayStatusModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selectedDate) {
    return (
      <div className="flex flex-col gap-4">
        <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-8 text-center text-secondary">
          <MaterialIcon name="event" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select a date on the calendar to manage availability.</p>
        </div>
        
        <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-6">
          <h3 className="mb-2 font-headline text-headline-sm font-bold">Integrations</h3>
          {!googleConnected ? (
            <>
              <p className="mb-4 text-sm text-secondary">Connect your Google Calendar to automatically block dates when you are busy.</p>
              <CalendarSyncButton userId={userId} onSyncComplete={onRefresh} />
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <MaterialIcon name="check_circle" /> Google Calendar Synced
            </div>
          )}
        </div>
      </div>
    );
  }

  const overrideEntry = entriesForSelectedDate.find((e) => e.kind.startsWith('override_'));
  const currentStatus = overrideEntry
    ? overrideEntry.kind === 'override_blocked'
      ? 'BLOCKED'
      : 'WARN'
    : 'OPEN';

  const manualEvents = entriesForSelectedDate.filter((e) => e.kind === 'manual_event');
  const limeBookings = entriesForSelectedDate.filter((e) => e.kind === 'booking');
  const googleEvents = entriesForSelectedDate.filter((e) => e.kind === 'google_event');

  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const dateStr = [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, '0'),
    String(selectedDate.getDate()).padStart(2, '0'),
  ].join('-');

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    setSavingStatus(true);
    setError(null);
    try {
      await api.post(`/calendar/${userId}/day-overrides`, {
        date: dateStr,
        status: newStatus,
      });
      onRefresh();
    } catch (err) {
      setError(getApiErrorMessage(err).message);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setSavingStatus(true);
    setError(null);
    try {
      await api.post(`/calendar/${userId}/manual-events`, {
        date: dateStr,
        title: eventTitle.trim(),
      });
      setEventTitle('');
      setAddingEvent(false);
      onRefresh();
      // Show the post-event action modal
      setShowDayStatusModal(true);
    } catch (err) {
      setError(getApiErrorMessage(err).message);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Delete this event?')) return;
    const realId = eventId.replace('manual-', '');
    setSavingStatus(true);
    setError(null);
    try {
      await api.delete(`/calendar/${userId}/manual-events/${realId}`);
      onRefresh();
    } catch (err) {
      setError(getApiErrorMessage(err).message);
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-8">
      <h3 className="mb-2 font-headline text-headline-md">{formattedDate}</h3>
      <p className="mb-6 text-sm text-secondary">Manage your availability and events for this day.</p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mb-6 space-y-3">
        <label className="block text-label-sm font-bold uppercase text-secondary">
          Day Status for Organizers
        </label>
        <div className="flex gap-1 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-1">
          {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((status) => (
            <button
              key={status}
              disabled={savingStatus}
              onClick={() => handleStatusChange(status)}
              className={cn(
                'flex-1 rounded-xl py-2 text-sm font-bold transition-all disabled:opacity-50',
                currentStatus === status
                  ? `${STATUS_META[status].active} shadow-sm`
                  : 'text-secondary hover:bg-surface-container',
              )}
            >
              {STATUS_META[status].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_META[currentStatus].dot)} />
          <p className="text-xs text-secondary">{STATUS_META[currentStatus].desc}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-label-sm font-bold uppercase text-secondary">Events</label>
          {!addingEvent && (
            <button
              onClick={() => setAddingEvent(true)}
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              <MaterialIcon name="add" size={16} /> Add Personal Event
            </button>
          )}
        </div>

        {addingEvent && (
          <form onSubmit={handleAddEvent} className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="e.g. Studio Session"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="flex-1 rounded-lg border-2 border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary-container"
            />
            <button
              type="submit"
              disabled={savingStatus || !eventTitle.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAddingEvent(false)}
              className="rounded-lg border-2 border-outline-variant px-3 py-2 text-sm hover:bg-surface-container"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="space-y-2">
          {limeBookings.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-lg border border-primary-container bg-primary-container/10 p-3">
              <span className="h-2 w-2 rounded-full bg-primary-container" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{b.title}</p>
                <p className="text-xs text-secondary">Lime Event • {b.status}</p>
              </div>
            </div>
          ))}
          {manualEvents.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-amber-400 bg-amber-400/10 p-3">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-amber-900">{m.title}</p>
                <p className="text-xs text-amber-700/80">Personal Event</p>
              </div>
              <button
                onClick={() => handleDeleteEvent(m.id)}
                className="text-amber-700/50 hover:text-amber-700"
                title="Delete event"
              >
                <MaterialIcon name="close" size={18} />
              </button>
            </div>
          ))}
          {googleEvents.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-lg border border-blue-400 bg-blue-400/10 p-3">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-blue-900">{g.title}</p>
                <p className="text-xs text-blue-700/80">Google Calendar</p>
              </div>
            </div>
          ))}
          {limeBookings.length === 0 && manualEvents.length === 0 && googleEvents.length === 0 && !addingEvent && (
            <p className="text-sm text-secondary italic">No events scheduled.</p>
          )}
        </div>
      </div>

      {showDayStatusModal && (
        <DayStatusModal
          isOpen={showDayStatusModal}
          onClose={() => {
            setShowDayStatusModal(false);
            onRefresh(); // Refresh calendar to show the new day status
          }}
          userId={userId}
          dateStr={dateStr}
        />
      )}
    </div>
  );
}
