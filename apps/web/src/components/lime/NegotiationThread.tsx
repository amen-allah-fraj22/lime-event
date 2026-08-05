'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { isBookingConfirmed } from '@/lib/artist-equipment-options';
import { cn } from '@/lib/utils';

type ThreadOffer = {
  kind: 'offer';
  id: string;
  created_at: string;
  proposed_by: string;
  fee: number;
  message: string | null;
  includes_transport: boolean;
  includes_meals: boolean;
  includes_accommodation: boolean;
  other_conditions: string | null;
  status: string;
};

type ThreadMessage = {
  kind: 'message';
  id: string;
  created_at: string;
  sender_id: string;
  content: string;
  message_type: string;
};

type ThreadItem = ThreadOffer | ThreadMessage;

export function NegotiationThread({
  bookingId,
  currentUserId,
  bookingStatus,
  onActivity,
  onOfferAccepted,
}: {
  bookingId: string;
  currentUserId: string;
  bookingStatus: string;
  onActivity?: () => void;
  onOfferAccepted?: () => void;
}) {
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [message, setMessage] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offer, setOffer] = useState({
    fee: '',
    message: '',
    includes_transport: false,
    includes_meals: false,
    includes_accommodation: false,
    other_conditions: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const confirmed = isBookingConfirmed(bookingStatus);

  const fetchThread = useCallback(async () => {
    try {
      const res = await api.get<ThreadItem[]>(`/booking-requests/${bookingId}/thread`, {
        skipGlobalError: true,
      });
      setThread(res.data);
    } catch {
      /* keep previous */
    }
  }, [bookingId]);

  useEffect(() => {
    void fetchThread();
    const interval = setInterval(() => void fetchThread(), 10000);
    return () => clearInterval(interval);
  }, [fetchThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  async function sendMessage() {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/booking-requests/${bookingId}/messages`, { content: message.trim() });
      setMessage('');
      await fetchThread();
      onActivity?.();
    } catch (e) {
      setError(getApiErrorMessage(e).message);
    } finally {
      setSending(false);
    }
  }

  async function sendOffer() {
    if (!offer.fee) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/booking-requests/${bookingId}/offers`, {
        fee: parseInt(offer.fee, 10),
        message: offer.message || undefined,
        includes_transport: offer.includes_transport,
        includes_meals: offer.includes_meals,
        includes_accommodation: offer.includes_accommodation,
        other_conditions: offer.other_conditions || undefined,
      });
      setShowOfferForm(false);
      setOffer({
        fee: '',
        message: '',
        includes_transport: false,
        includes_meals: false,
        includes_accommodation: false,
        other_conditions: '',
      });
      await fetchThread();
      onActivity?.();
    } catch (e) {
      setError(getApiErrorMessage(e).message);
    } finally {
      setSending(false);
    }
  }

  async function acceptOffer(offerId: string) {
    setSending(true);
    let closeEvent = false;
    // We only prompt organizers since they own the event.
    // If we can't tell, we just show it, but backend will verify.
    if (confirm("Does this complete your lineup? Click OK to close the event and decline other pending applications, or Cancel to leave it open.")) {
      closeEvent = true;
    }
    try {
      await api.post(`/booking-requests/${bookingId}/offers/${offerId}/accept?closeEvent=${closeEvent}`);
      await fetchThread();
      onActivity?.();
      onOfferAccepted?.();
    } catch (e) {
      setError(getApiErrorMessage(e).message);
    } finally {
      setSending(false);
    }
  }

  async function declineOffer(offerId: string, openCounter: boolean) {
    setSending(true);
    try {
      await api.post(`/booking-requests/${bookingId}/offers/${offerId}/decline`);
      if (openCounter) setShowOfferForm(true);
      await fetchThread();
      onActivity?.();
    } catch (e) {
      setError(getApiErrorMessage(e).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      {confirmed && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary-container bg-lime/15 px-4 py-3 text-sm font-semibold">
          <span>✅</span> Booking confirmed — you can keep coordinating here.
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 420 }}>
        {thread.length === 0 && (
          <p className="py-8 text-center text-sm text-secondary">
            No messages yet. Say hello or send an offer to get started.
          </p>
        )}

        {thread.map((item) => {
          if (item.kind === 'offer') {
            const isMine = item.proposed_by === currentUserId;
            const isPending = item.status === 'pending';
            const canRespond = !isMine && isPending && !confirmed;

            return (
              <div
                key={`offer-${item.id}`}
                className={cn('max-w-[90%]', isMine ? 'ml-auto' : 'mr-auto')}
              >
                <div
                  className={cn(
                    'rounded-xl border-2 bg-white p-4',
                    item.status === 'superseded' && 'opacity-50',
                    isPending ? 'border-primary-container' : 'border-surface-variant',
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase text-secondary">
                      {isMine ? 'Your offer' : 'Offer'}
                    </span>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold capitalize">
                      {item.status}
                    </span>
                  </div>
                  <p className="font-headline text-2xl font-bold">
                    {item.fee.toLocaleString()} TND
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.includes_transport && (
                      <span className="lime-chip text-xs">Transport</span>
                    )}
                    {item.includes_meals && <span className="lime-chip text-xs">Meals</span>}
                    {item.includes_accommodation && (
                      <span className="lime-chip text-xs">Accommodation</span>
                    )}
                  </div>
                  {item.other_conditions && (
                    <p className="mt-2 text-xs text-secondary">{item.other_conditions}</p>
                  )}
                  {item.message && (
                    <p className="mt-2 text-sm italic text-secondary">&ldquo;{item.message}&rdquo;</p>
                  )}
                  {canRespond && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => acceptOffer(item.id)}
                        className="lime-btn-primary flex-1 py-2 text-xs"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => declineOffer(item.id, true)}
                        className="lime-btn-outline flex-1 py-2 text-xs"
                      >
                        Counter
                      </button>
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => declineOffer(item.id, false)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
                <p className={cn('mt-1 text-[10px] text-secondary', isMine && 'text-right')}>
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            );
          }

          if (item.kind === 'message') {
            if (item.message_type === 'offer') return null;
            if (item.message_type === 'system') {
              return (
                <p key={item.id} className="text-center text-xs text-secondary">
                  {item.content}
                </p>
              );
            }

            const isMe = item.sender_id === currentUserId;
            return (
              <div
                key={item.id}
                className={cn('max-w-[85%] md:max-w-[75%]', isMe ? 'ml-auto' : 'mr-auto')}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm backdrop-blur-sm',
                    isMe 
                      ? 'bg-gradient-to-br from-primary to-primary/90 text-on-primary rounded-tr-sm' 
                      : 'bg-surface-container/80 border border-surface-variant text-on-surface rounded-tl-sm',
                  )}
                >
                  {item.content}
                </div>
                <p className={cn('mt-1 text-[10px] font-medium text-secondary/70', isMe && 'text-right')}>
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            );
          }

          return null;
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {showOfferForm && !confirmed && (
        <div className="mt-3 rounded-xl border border-primary-container bg-lime/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Propose an offer</span>
            <button
              type="button"
              className="text-secondary"
              onClick={() => setShowOfferForm(false)}
            >
              ×
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              placeholder="Fee (TND)"
              className="lime-input flex-1 text-center font-bold"
              value={offer.fee}
              onChange={(e) => setOffer((o) => ({ ...o, fee: e.target.value }))}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ['includes_transport', 'Transport'],
                ['includes_meals', 'Meals'],
                ['includes_accommodation', 'Stay'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setOffer((o) => ({ ...o, [key]: !o[key as keyof typeof o] }))
                }
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  offer[key as keyof typeof offer]
                    ? 'border-primary-container bg-primary-container'
                    : 'border-surface-variant bg-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className="lime-input mt-2"
            placeholder="Note (optional)"
            value={offer.other_conditions}
            onChange={(e) => setOffer((o) => ({ ...o, other_conditions: e.target.value }))}
          />
          <button
            type="button"
            disabled={!offer.fee || sending}
            onClick={() => void sendOffer()}
            className="lime-btn-primary mt-3 w-full py-2 text-sm disabled:opacity-50"
          >
            Send offer
          </button>
        </div>
      )}

      <div className="mt-4 flex gap-3 border-t border-surface-variant pt-4 pb-2 md:pb-0">
        {!confirmed && (
          <button
            type="button"
            onClick={() => setShowOfferForm((v) => !v)}
            className="lime-btn-outline shrink-0 px-4 py-3 text-sm font-bold shadow-sm"
          >
            Offer
          </button>
        )}
        <input
          className="w-full rounded-2xl border-2 border-outline-variant bg-surface-container-lowest p-3 shadow-inner focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={
            confirmed
              ? 'Coordinate details (logistics, timing, etc.)…'
              : 'Type a message…'
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void sendMessage();
            }
          }}
        />
        <button
          type="button"
          disabled={!message.trim() || sending}
          onClick={() => void sendMessage()}
          className="rounded-full bg-primary px-5 py-3 font-label-lg font-bold text-on-primary hover:scale-105 disabled:opacity-50 shadow-md"
        >
          Send
        </button>
      </div>
    </div>
  );
}
