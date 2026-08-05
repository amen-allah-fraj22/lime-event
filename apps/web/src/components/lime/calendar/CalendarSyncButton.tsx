'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import api from '@/lib/api';

export function CalendarSyncButton({ userId, onSyncComplete }: { userId: string, onSyncComplete?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/calendar/${userId}/google/auth-url`);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      setError('Failed to initiate Google Calendar connection.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl border border-surface-variant bg-white px-4 py-3 text-sm font-semibold text-brand-text shadow-sm transition-all hover:bg-surface-container-low"
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="h-5 w-5" />
        {loading ? 'Connecting...' : 'Connect Google Calendar'}
      </button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
