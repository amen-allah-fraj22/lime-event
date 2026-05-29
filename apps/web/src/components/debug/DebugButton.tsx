'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAppStatus } from '@/components/providers/AppStatusProvider';
import api from '@/lib/api';

function StatusDot({ ok }: { ok: boolean | null }) {
  const color =
    ok === true ? 'bg-green-500' : ok === false ? 'bg-red-500' : 'bg-amber-400';
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-surface-variant py-2 text-sm last:border-0">
      <span className="shrink-0 text-brand-accent">{label}</span>
      <span className="text-right font-mono text-xs text-brand-text">{children}</span>
    </div>
  );
}

export function DebugButton() {
  const show =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_SHOW_DEBUG === 'true';

  const pathname = usePathname();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { apiOk, dbConnected, apiMessage, lastError, checkApi, isChecking, clearError } =
    useAppStatus();

  const [open, setOpen] = useState(false);
  const [stylesheetCount, setStylesheetCount] = useState<number | null>(null);
  const [artistsCount, setArtistsCount] = useState<number | null>(null);
  const [artistsError, setArtistsError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const clerkKeySet = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const refreshExtras = useCallback(async () => {
    if (typeof document !== 'undefined') {
      setStylesheetCount(document.querySelectorAll('link[rel="stylesheet"], style').length);
    }
    try {
      const res = await api.get('/artists');
      setArtistsCount(Array.isArray(res.data) ? res.data.length : null);
      setArtistsError(null);
    } catch (e) {
      setArtistsCount(null);
      setArtistsError(e instanceof Error ? e.message : 'Failed');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    refreshExtras();
  }, [open, refreshExtras]);

  if (!show) return null;

  const role =
    (user?.unsafeMetadata?.role as string) ??
    (user?.publicMetadata?.role as string) ??
    '—';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-[200] flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-text bg-lime-container font-mono text-xs font-bold shadow-lg transition hover:brightness-95"
        title="Open debug panel"
        aria-expanded={open}
        aria-label="Debug panel"
      >
        DBG
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-4 z-[200] w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border-2 border-brand-text bg-white shadow-xl"
          role="dialog"
          aria-label="Debug information"
        >
          <div className="flex items-center justify-between border-b border-surface-variant bg-surface px-4 py-3">
            <h2 className="font-headline text-sm font-bold">LIME Debug</h2>
            <button
              type="button"
              className="text-xs font-semibold text-brand-accent hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-4 py-2">
            <Row label="Page">
              {pathname}
            </Row>
            <Row label="API URL">{apiUrl}</Row>
            <Row label="API">
              <span className="inline-flex items-center gap-2">
                <StatusDot ok={apiOk} />
                {apiOk === true ? 'online' : apiOk === false ? 'offline' : '…'}
              </span>
            </Row>
            <Row label="Database">
              <span className="inline-flex items-center gap-2">
                <StatusDot ok={dbConnected} />
                {dbConnected === true ? 'connected' : dbConnected === false ? 'disconnected' : '—'}
              </span>
            </Row>
            <Row label="CSS loaded">
              <span className="inline-flex items-center gap-2">
                <StatusDot ok={stylesheetCount != null && stylesheetCount > 0} />
                {stylesheetCount ?? '—'} stylesheet(s)
              </span>
            </Row>
            <Row label="Clerk key">
              <span className="inline-flex items-center gap-2">
                <StatusDot ok={clerkKeySet} />
                {clerkKeySet ? 'set' : 'missing'}
              </span>
            </Row>
            <Row label="Auth">
              {!isLoaded
                ? 'loading…'
                : isSignedIn
                  ? `${userId?.slice(0, 12)}…`
                  : 'signed out'}
            </Row>
            <Row label="Role">{role}</Row>
            <Row label="Artists API">
              {artistsError
                ? `error`
                : artistsCount != null
                  ? `${artistsCount} profiles`
                  : '—'}
            </Row>

            {apiMessage && (
              <p className="mt-2 rounded-lg bg-surface-container p-2 text-xs text-brand-accent">
                {apiMessage}
              </p>
            )}
            {lastError && (
              <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800">
                {lastError.message}
                {lastError.status != null && ` (${lastError.status})`}
              </p>
            )}
            {artistsError && (
              <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800">{artistsError}</p>
            )}
            {stylesheetCount === 0 && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                No stylesheets detected. Run: npm run dev:web:clean
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-surface-variant bg-surface p-3">
            <button
              type="button"
              className="lime-btn-primary flex-1 py-2 text-xs"
              disabled={isChecking}
              onClick={() => {
                checkApi();
                refreshExtras();
              }}
            >
              {isChecking ? 'Checking…' : 'Refresh'}
            </button>
            <button
              type="button"
              className="lime-btn-secondary flex-1 py-2 text-xs"
              onClick={clearError}
            >
              Clear error
            </button>
          </div>

          <div className="border-t border-surface-variant px-3 py-2 text-[10px] text-brand-accent">
            <a href={`${apiUrl}/health`} target="_blank" rel="noreferrer" className="underline">
              /health
            </a>
            {' · '}
            <a href={`${apiUrl}/health/db`} target="_blank" rel="noreferrer" className="underline">
              /health/db
            </a>
          </div>
        </div>
      )}
    </>
  );
}
