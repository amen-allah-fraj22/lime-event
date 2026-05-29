'use client';

import { useEffect, useRef, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import type { BookingDetail } from './types';

export function BookingChat({
  booking,
  meId,
  peerName,
  onSend,
  compact,
}: {
  booking: BookingDetail;
  meId: string;
  peerName: string;
  onSend: (content: string) => Promise<void>;
  compact?: boolean;
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

  const header = (
    <div className="flex items-center justify-between border-b border-outline-variant p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime/30 font-bold text-primary">
          {peerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 className="font-label-md">{peerName}</h4>
          <p className="font-label-sm text-secondary">Messages</p>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={
        compact
          ? 'flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
          : 'dashboard-shadow flex flex-col overflow-hidden rounded-xl bg-white lg:col-span-5 lg:h-[520px]'
      }
    >
      {header}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-surface-container-low/50 p-6">
        {booking.messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={cnWrap(mine)}>
              <div
                className={
                  mine
                    ? 'max-w-[80%] rounded-2xl rounded-tr-none bg-primary-container p-4 text-on-primary-container shadow-sm'
                    : 'max-w-[80%] rounded-2xl rounded-tl-none border border-outline-variant bg-surface-container-high p-4'
                }
              >
                <p className="font-body-md">{m.content}</p>
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
      <div className="border-t border-outline-variant bg-surface p-4">
        <div className="flex items-center gap-3 rounded-xl border-2 border-outline-variant bg-white p-2 focus-within:border-primary-container">
          <input
            className="flex-1 border-none bg-transparent font-body-md focus:ring-0"
            placeholder="Type your message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button
            type="button"
            disabled={sending}
            onClick={handleSend}
            className="rounded-lg bg-primary p-2 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            <MaterialIcon name="send" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function cnWrap(mine: boolean) {
  return mine ? 'flex justify-end' : 'flex justify-start';
}
