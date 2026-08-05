'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { AppShell } from '@/components/layout/AppShell';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface BookingRequest {
  id: string;
  status: string;
  message?: string;
  quote_amount?: number;
  agreed_fee?: number;
  created_at: string;
  quote_conditions?: { initiated_by?: string } | null;
  event?: {
    id: string;
    title: string;
    event_date: string;
    city?: string;
    event_type: string;
  };
  artist?: {
    id: string;
    email: string;
    artist_profile?: {
      display_name: string;
      profile_photo_url?: string;
      city?: string;
    };
  };
  organizer?: {
    id: string;
    email: string;
  };
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:     { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
  quoted:      { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Quoted' },
  negotiating: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Negotiating' },
  accepted:    { bg: 'bg-lime/20', text: 'text-lime-dark', label: 'Accepted' },
  contracted:  { bg: 'bg-green-100', text: 'text-green-800', label: 'Contracted' },
  completed:   { bg: 'bg-green-200', text: 'text-green-900', label: 'Completed' },
  declined:    { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined' },
  cancelled:   { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
  expired:     { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Expired' },
};

export default function RequestsPage() {
  const { activeRole } = useRole();
  const router = useRouter();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/booking-requests', { skipGlobalError: true })
      .then((res: any) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setRequests(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isArtist = activeRole === 'artist';

  const received = requests.filter(req => {
    const initiator = req.quote_conditions?.initiated_by ?? 'organizer';
    return isArtist ? initiator === 'organizer' : initiator === 'artist';
  });
  
  const sent = requests.filter(req => {
    const initiator = req.quote_conditions?.initiated_by ?? 'organizer';
    return isArtist ? initiator === 'artist' : initiator === 'organizer';
  });
  
  const displayList = tab === 'received' ? received : sent;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-TN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-container-max px-4 py-6 md:px-10">
        {/* Header */}
        <h1 className="font-headline text-headline-md text-brand-text">Requests</h1>
        <p className="mt-1 text-sm text-brand-accent">
          {isArtist
            ? 'Booking requests from organizers and your outgoing interests'
            : 'Your booking requests to artists and incoming interest from musicians'}
        </p>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 rounded-lg bg-surface-container p-1">
          <button
            onClick={() => setTab('received')}
            className={cn(
              'flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all',
              tab === 'received'
                ? 'bg-white text-brand-text shadow-sm'
                : 'text-brand-accent hover:text-brand-text',
            )}
          >
            Received
            {received.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-lime/20 px-1.5 text-[11px] font-bold text-lime-dark">
                {received.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={cn(
              'flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all',
              tab === 'sent'
                ? 'bg-white text-brand-text shadow-sm'
                : 'text-brand-accent hover:text-brand-text',
            )}
          >
            Sent
            {sent.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-lime/20 px-1.5 text-[11px] font-bold text-lime-dark">
                {sent.length}
              </span>
            )}
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="lime-card animate-pulse p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface-container" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-surface-container" />
                    <div className="h-3 w-1/3 rounded bg-surface-container" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-surface-container" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && displayList.length === 0 && (
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-surface-container-high">
              {tab === 'received' ? 'inbox' : 'outbox'}
            </span>
            <h3 className="font-headline text-lg font-semibold text-brand-text">
              {tab === 'received' ? 'No requests received yet' : 'No requests sent yet'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-brand-accent">
              {tab === 'received'
                ? isArtist
                  ? 'When organizers send you booking requests, they will appear here.'
                  : 'When musicians show interest in your events, they will appear here.'
                : isArtist
                ? 'Explore events and show your interest to get started!'
                : 'Browse artists and send booking requests to get started!'}
            </p>
          </div>
        )}

        {/* Request cards */}
        {!loading && displayList.length > 0 && (
          <div className="mt-4 space-y-3">
            {displayList.map((req) => {
              const status = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
              const artistName =
                req.artist?.artist_profile?.display_name ?? req.artist?.email ?? 'Artist';
              const eventTitle = req.event?.title ?? 'Event';

              return (
                <button
                  key={req.id}
                  onClick={() => router.push(`/messages/${req.id}`)}
                  className="lime-card w-full p-4 text-left transition-all hover:shadow-float"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar placeholder */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-lime/20">
                      <span className="material-symbols-outlined text-[20px] text-lime-dark">
                        {isArtist ? 'business' : 'music_note'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="truncate font-semibold text-brand-text">
                          {isArtist ? eventTitle : artistName}
                        </h4>
                        <span
                          className={cn(
                            'flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                            status.bg,
                            status.text,
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-brand-accent">
                        {isArtist ? `From: ${req.organizer?.email ?? 'Organizer'}` : eventTitle}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[12px] text-brand-accent">
                        {req.event?.event_date && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {formatDate(req.event.event_date)}
                          </span>
                        )}
                        {(req.quote_amount || req.agreed_fee) && (
                          <span className="flex items-center gap-1 font-medium text-lime-dark">
                            <span className="material-symbols-outlined text-[14px]">payments</span>
                            {req.agreed_fee ?? req.quote_amount} TND
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <span className="material-symbols-outlined text-[20px] text-surface-variant">
                      chevron_right
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
