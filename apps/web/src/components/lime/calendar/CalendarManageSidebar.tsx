'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import type { CalendarEntry } from './calendar-utils';
import { DayStatusModal } from './DayStatusModal';
import { CalendarSyncButton } from './CalendarSyncButton';

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

      <div className="mb-6 space-y-2">
        <label className="block text-label-sm font-bold uppercase text-secondary">
          Day Status for Organizers
        </label>
        <div className="flex flex-col gap-2">
          <button
            disabled={savingStatus}
            onClick={() => handleStatusChange('OPEN')}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
              currentStatus === 'OPEN'
                ? 'border-primary bg-primary/10'
                : 'border-outline-variant hover:border-outline'
            } disabled:opacity-50`}
          >
            <span className="text-xl">🟢</span>
            <div>
              <p className={`text-sm font-bold ${currentStatus === 'OPEN' ? 'text-primary' : 'text-on-surface'}`}>Open</p>
              <p className="text-xs text-secondary">Available for requests</p>
            </div>
          </button>

          <button
            disabled={savingStatus}
            onClick={() => handleStatusChange('WARN')}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
              currentStatus === 'WARN'
                ? 'border-amber-400 bg-amber-50'
                : 'border-outline-variant hover:border-outline'
            } disabled:opacity-50`}
          >
            <span className="text-xl">🟡</span>
            <div>
              <p className={`text-sm font-bold ${currentStatus === 'WARN' ? 'text-amber-900' : 'text-on-surface'}`}>Busy (Warn)</p>
              <p className="text-xs text-secondary">Warn organizers, allow requests</p>
            </div>
          </button>

          <button
            disabled={savingStatus}
            onClick={() => handleStatusChange('BLOCKED')}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
              currentStatus === 'BLOCKED'
                ? 'border-red-400 bg-red-50'
                : 'border-outline-variant hover:border-outline'
            } disabled:opacity-50`}
          >
            <span className="text-xl">🔴</span>
            <div>
              <p className={`text-sm font-bold ${currentStatus === 'BLOCKED' ? 'text-red-900' : 'text-on-surface'}`}>Blocked</p>
              <p className="text-xs text-secondary">No requests allowed</p>
            </div>
          </button>
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
