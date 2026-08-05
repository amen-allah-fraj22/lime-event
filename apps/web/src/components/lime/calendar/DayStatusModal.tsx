'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import api from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  dateStr: string;
}

export function DayStatusModal({ isOpen, onClose, userId, dateStr }: Props) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSelect(status: 'OPEN' | 'WARN' | 'BLOCKED') {
    setSubmitting(true);
    try {
      await api.post(`/calendar/${userId}/day-overrides`, {
        date: dateStr,
        status,
      });
      onClose();
    } catch (err) {
      console.error(err);
      onClose(); // Close anyway on error to not block user
    } finally {
      setSubmitting(false);
    }
  }

  const formattedDate = new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} labelledBy="day-status-title">
      <div className="p-6 sm:p-8">
        <h2 id="day-status-title" className="font-headline text-xl font-bold">
          Update Availability for {formattedDate}
        </h2>
        <p className="mt-2 text-sm text-secondary">
          You now have an event on this date. How should we handle other incoming requests for the rest of the day?
        </p>

        <div className="mt-6 space-y-3">
          <button
            disabled={submitting}
            onClick={() => handleSelect('OPEN')}
            className="w-full rounded-xl border-2 border-outline-variant p-4 text-left transition-colors hover:border-primary-container disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🟢</span>
              <div>
                <p className="font-bold text-on-surface">Keep Open</p>
                <p className="text-xs text-secondary">Organizers can request normally without warnings.</p>
              </div>
            </div>
          </button>

          <button
            disabled={submitting}
            onClick={() => handleSelect('WARN')}
            className="w-full rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-left transition-colors hover:border-amber-400 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🟡</span>
              <div>
                <p className="font-bold text-amber-900">Warn Organizers (Recommended)</p>
                <p className="text-xs text-amber-700">Organizers see that you have limited availability, but can still request.</p>
              </div>
            </div>
          </button>

          <button
            disabled={submitting}
            onClick={() => handleSelect('BLOCKED')}
            className="w-full rounded-xl border-2 border-red-200 bg-red-50 p-4 text-left transition-colors hover:border-red-400 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔴</span>
              <div>
                <p className="font-bold text-red-900">Block Day</p>
                <p className="text-xs text-red-700">Strictly prevent any more requests for this date.</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 block w-full text-center text-sm font-semibold text-secondary hover:text-on-surface"
        >
          Skip for now
        </button>
      </div>
    </ModalOverlay>
  );
}
