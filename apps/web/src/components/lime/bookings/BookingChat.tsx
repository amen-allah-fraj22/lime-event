'use client';

import { useEffect, useRef, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import type { BookingDetail } from './types';
import { cn } from '@/lib/utils';

export function BookingChat({
  booking,
  meId,
  peerName,
  onSend,
  className,
}: {
  booking: BookingDetail;
  meId: string;
  peerName: string;
  onSend: (content: string) => Promise<void>;
  className?: string;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [booking.messages.length]);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await onSend(message.trim());
      setMessage('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-card',
        'lg:min-h-[480px] xl:min-h-0 xl:h-full',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-outline-variant p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime/30 font-bold text-primary">
            {peerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-label-md">{peerName}</h4>
            <p className="font-label-sm text-secondary">Messages</p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface-container-low/50 p-4 sm:p-6"
      >
        {booking.messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  mine
                    ? 'max-w-[85%] rounded-2xl rounded-tr-none bg-primary-container p-3 text-on-primary-container shadow-sm sm:max-w-[80%] sm:p-4'
                    : 'max-w-[85%] rounded-2xl rounded-tl-none border border-outline-variant bg-surface-container-high p-3 sm:max-w-[80%] sm:p-4'
                }
              >
                <p className="break-words font-body-md">{m.content}</p>
                <span
                  className={`mt-1 block font-label-sm opacity-70 ${mine ? 'text-right' : 'text-secondary'}`}
                >
                  {new Date(m.created_at).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
        {booking.messages.length === 0 && (
          <p className="text-center text-sm text-secondary">No messages yet — say hello.</p>
        )}
      </div>

      <div className="shrink-0 border-t border-outline-variant bg-surface p-3 sm:p-4">
        <div className="flex items-center gap-2 rounded-xl border-2 border-outline-variant bg-white p-2 focus-within:border-primary-container sm:gap-3">
          <input
            className="min-w-0 flex-1 border-none bg-transparent font-body-md outline-none focus:ring-0"
            placeholder="Type your message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            type="button"
            disabled={sending || !message.trim()}
            onClick={() => void handleSend()}
            className="shrink-0 rounded-lg bg-primary p-2 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            aria-label="Send message"
          >
            <MaterialIcon name="send" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
