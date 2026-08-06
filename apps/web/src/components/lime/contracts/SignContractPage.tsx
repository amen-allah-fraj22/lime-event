'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { useDbUser } from '@/components/providers/UserSessionProvider';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

type Contract = {
  id: string;
  status: string;
  organizer_signed_at?: string | null;
  artist_signed_at?: string | null;
  booking_request: {
    organizer_id: string;
    artist_id: string;
    quote_amount?: number | null;
    event: { title: string; event_date: string; city?: string | null; venue?: string | null };
    artist: { artist_profile?: { display_name: string } | null };
    organizer: { email: string };
  };
};

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_organizer: 'Waiting for organizer signature',
    pending_artist: 'Waiting for artist counter-signature',
    signed: 'Fully signed',
    draft: 'Draft',
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

export function SignContractPage({ contractId }: { contractId: string }) {
  const { user: dbUser } = useDbUser();
  const me = dbUser ? { id: dbUser.id, roles: dbUser.roles } : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const load = useCallback(async () => {
    const [cRes, htmlRes] = await Promise.all([
      api.get(`/contracts/${contractId}`),
      api.get(`/contracts/${contractId}/pdf`, { responseType: 'text' }),
    ]);
    setContract(cRes.data);
    setPreviewHtml(htmlRes.data);
  }, [contractId]);

  useEffect(() => {
    load()
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setPageLoading(false));
  }, [load]);

  useEffect(() => {
    if (pageLoading || !contract) return;

    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#2E2E2E';
      }
    }

    const t = window.setTimeout(resize, 0);
    window.addEventListener('resize', resize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', resize);
    };
    // Keyed on contract.status rather than the contract object: only a status
    // change alters the rendered layout, and the object identity changes on
    // every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLoading, contract?.status]);

  function getPoint(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setDrawing(true);
    setHasSigned(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function endDraw() {
    setDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }

  async function sign() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoading(true);
    setError(null);
    try {
      const signature = canvas.toDataURL('image/png');
      await api.post(`/contracts/${contractId}/sign`, { signature });
      await load();
      clearSignature();
      setAgreed(false);
      setHasSigned(false);
    } catch (e) {
      setError(getApiErrorMessage(e).message);
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingBlock label="Loading contract…" />
      </div>
    );
  }

  if (!contract || !me) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorAlert message={error ?? 'Contract not found'} />
      </div>
    );
  }

  const br = contract.booking_request;
  const artistName = br.artist.artist_profile?.display_name ?? 'Artist';
  const isOrganizerParty = br.organizer_id === me.id;
  const isArtistParty = br.artist_id === me.id;
  const canSignOrganizer =
    isOrganizerParty &&
    contract.status === 'pending_organizer' &&
    !contract.organizer_signed_at;
  const canSignArtist =
    isArtistParty && contract.status === 'pending_artist' && !contract.artist_signed_at;
  const canSign = canSignOrganizer || canSignArtist;

  return (
    <div className="flex min-h-screen flex-col bg-surface font-body-md text-on-surface">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface px-gutter py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-full p-2 text-secondary transition-colors hover:bg-surface-container-high"
          >
            <MaterialIcon name="arrow_back" />
          </Link>
          <span className="font-headline text-headline-md font-extrabold text-primary">LIME</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-secondary-container px-3 py-1 font-label-sm text-on-secondary-container">
            {statusLabel(contract.status)}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <section className="w-full overflow-y-auto border-r border-outline-variant bg-surface-container-low p-gutter md:w-3/5">
          <div className="contract-paper mx-auto max-w-3xl rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-8 md:p-12">
            <div className="mb-8 flex items-start justify-between border-b-2 border-primary-container pb-8">
              <div>
                <h1 className="mb-2 font-headline text-headline-lg">Performance Agreement</h1>
                <p className="font-label-md text-secondary">Document ID: #{contract.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className="font-headline text-headline-md font-black text-primary">LIME</span>
            </div>
            <div className="mb-8">
              <h2 className="mb-4 font-label-md text-primary">EVENT SUMMARY</h2>
              <div className="grid grid-cols-2 gap-6 rounded-lg bg-surface-container p-6">
                <div>
                  <p className="mb-1 font-label-sm uppercase text-secondary">Event Name</p>
                  <p className="font-bold">{br.event.title}</p>
                </div>
                <div>
                  <p className="mb-1 font-label-sm uppercase text-secondary">Fee</p>
                  <p className="font-bold text-primary">
                    {(br.quote_amount ?? 0).toLocaleString()} TND
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-label-sm uppercase text-secondary">Date</p>
                  <p>{new Date(br.event.event_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="mb-1 font-label-sm uppercase text-secondary">Location</p>
                  <p>{br.event.venue ?? br.event.city ?? 'Tunisia'}</p>
                </div>
                <div>
                  <p className="mb-1 font-label-sm uppercase text-secondary">Artist</p>
                  <p>{artistName}</p>
                </div>
                <div>
                  <p className="mb-1 font-label-sm uppercase text-secondary">Organizer</p>
                  <p>{br.organizer.email}</p>
                </div>
              </div>
            </div>
            {previewHtml ? (
              <div
                className="prose prose-sm max-w-none text-on-surface-variant"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="space-y-4 text-on-surface-variant">
                <h3 className="font-headline text-headline-md text-on-surface">Terms and Conditions</h3>
                <p>
                  The Artist agrees to provide performance services as agreed in the booking quote. Payment terms
                  follow the LIME escrow process.
                </p>
                <p>This agreement is governed by the laws of the Republic of Tunisia.</p>
              </div>
            )}
          </div>
        </section>

        <section className="flex w-full flex-col justify-between bg-surface p-gutter md:w-2/5">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div>
              <h3 className="mb-2 font-headline text-headline-md">Finalize Agreement</h3>
              <p className="text-secondary">
                Review the contract and provide your signature below to proceed.
              </p>
            </div>

            {error && <ErrorAlert message={error} />}

            {contract.status === 'signed' && (
              <div className="rounded-lg bg-primary-container/20 p-4 font-semibold text-primary">
                Contract fully signed by both parties.
              </div>
            )}

            {canSign && (
              <>
                <div>
                  <div className="mb-2 flex items-end justify-between">
                    <label className="font-label-md uppercase">Draw signature</label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="font-label-sm text-primary hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border-2 border-outline-variant bg-white">
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        startDraw(e);
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        draw(e);
                      }}
                      onTouchEnd={endDraw}
                    />
                    {!hasSigned && (
                      <span className="pointer-events-none font-label-md text-outline-variant">Sign here</span>
                    )}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-low p-4">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-outline text-primary"
                  />
                  <span className="text-on-surface-variant">
                    I confirm that I have read and agree to the terms of this contract for{' '}
                    <strong>{br.event.title}</strong>.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={loading || !hasSigned || !agreed}
                  onClick={sign}
                  className={cn(
                    'w-full rounded-xl bg-primary-container py-4 font-headline text-headline-md font-bold text-on-primary-container shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  {loading ? 'Processing…' : 'Sign Contract'}
                </button>
                <p className="text-center font-label-sm text-secondary">
                  Secure signing via LIME Talent Marketplace
                </p>
              </>
            )}

            {!canSign && contract.status !== 'signed' && (
              <p className="text-secondary">
                {isOrganizerParty && contract.organizer_signed_at
                  ? 'You have signed. Waiting for the artist.'
                  : isArtistParty && contract.artist_signed_at
                    ? 'You have signed. Waiting for the organizer.'
                    : 'Signing is not available for you at this stage.'}
              </p>
            )}

            <Link
              href="/dashboard/bookings"
              className="block text-center font-label-md font-bold text-primary hover:underline"
            >
              Back to bookings
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
