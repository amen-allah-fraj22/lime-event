'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { AppShell } from '@/components/layout/AppShell';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface ConversationPreview {
  id: string; // booking request id
  status: string;
  event?: {
    title: string;
    event_date: string;
  };
  artist?: {
    email: string;
    artist_profile?: {
      display_name: string;
      profile_photo_url?: string;
    };
  };
  organizer?: {
    email: string;
  };
  messages?: { content: string; created_at: string; sender_id: string }[];
}

export default function MessagesPage() {
  const { activeRole } = useRole();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const isArtist = activeRole === 'artist';

  useEffect(() => {
    setLoading(true);
    api
      .get('/booking-requests', { skipGlobalError: true })
      .then((res: any) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        // Only show conversations that have activity (not just pending with no messages)
        setConversations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d`;
      return d.toLocaleDateString('fr-TN', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-container-max px-4 py-6 md:px-10">
        {/* Header */}
        <h1 className="font-headline text-headline-md text-brand-text">Messages</h1>
        <p className="mt-1 text-sm text-brand-accent">
          Your conversations about bookings
        </p>

        {/* Loading */}
        {loading && (
          <div className="mt-5 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-surface-variant bg-white p-4">
                <div className="h-12 w-12 rounded-full bg-surface-container" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-surface-container" />
                  <div className="h-3 w-3/4 rounded bg-surface-container" />
                </div>
                <div className="h-3 w-8 rounded bg-surface-container" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && conversations.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-surface-container-high">
              forum
            </span>
            <h3 className="font-headline text-lg font-semibold text-brand-text">
              No conversations yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-brand-accent">
              {isArtist
                ? 'When you receive booking requests or explore events, your conversations will appear here.'
                : 'Send booking requests to artists to start conversations.'}
            </p>
          </div>
        )}

        {/* Conversation list */}
        {!loading && conversations.length > 0 && (
          <div className="mt-5 space-y-1">
            {conversations.map((conv) => {
              const displayName = isArtist
                ? conv.organizer?.email ?? 'Organizer'
                : conv.artist?.artist_profile?.display_name ?? conv.artist?.email ?? 'Artist';
              const eventTitle = conv.event?.title ?? 'Booking';
              const lastMsg = conv.messages?.[conv.messages.length - 1];

              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-white p-4 text-left transition-all hover:border-lime/30 hover:shadow-card"
                >
                  {/* Avatar */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-lime/15">
                    <span className="material-symbols-outlined text-[24px] text-lime-dark">
                      {isArtist ? 'person' : 'music_note'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="truncate text-sm font-bold text-brand-text">
                        {displayName}
                      </h4>
                      {lastMsg && (
                        <span className="flex-shrink-0 text-[11px] text-brand-accent">
                          {formatTime(lastMsg.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[13px] text-brand-accent">
                      {eventTitle}
                    </p>
                    {lastMsg && (
                      <p className="mt-0.5 truncate text-[12px] text-brand-accent/70">
                        {lastMsg.content}
                      </p>
                    )}
                  </div>

                  {/* Chevron */}
                  <span className="material-symbols-outlined text-[18px] text-surface-variant">
                    chevron_right
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
