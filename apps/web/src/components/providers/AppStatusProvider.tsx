'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api, { setApiGlobalErrorHandler, type ApiGlobalError } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';

type AppStatus = {
  apiOk: boolean | null;
  dbConnected: boolean | null;
  apiMessage: string | null;
  lastError: ApiGlobalError | null;
  clearError: () => void;
  checkApi: () => Promise<void>;
  isChecking: boolean;
};

const AppStatusContext = createContext<AppStatus | null>(null);

export function useAppStatus() {
  const ctx = useContext(AppStatusContext);
  if (!ctx) throw new Error('useAppStatus must be used within AppStatusProvider');
  return ctx;
}

export function AppStatusProvider({
  children,
  deferHealthCheck = false,
}: {
  children: React.ReactNode;
  /** Skip immediate health pings on marketing routes (faster first paint). */
  deferHealthCheck?: boolean;
}) {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [lastError, setLastError] = useState<ApiGlobalError | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const isCheckingRef = useRef(false);

  const clearError = useCallback(() => setLastError(null), []);

  const checkApi = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);
    try {
      const health = await api.get('/health', { skipGlobalError: true });
      setApiOk(true);
      setApiMessage(`API online (${health.data.service})`);
      api
        .get('/health/db', { skipGlobalError: true })
        .then((db) => {
          const dbOk = db?.data?.database === 'connected';
          setDbConnected(dbOk);
          if (!dbOk) {
            setApiMessage('API online · database disconnected — check DATABASE_URL');
          }
        })
        .catch(() => setDbConnected(null));
    } catch (e) {
      const info = getApiErrorMessage(e);
      setApiOk(false);
      setDbConnected(null);
      setApiMessage(info.message);
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    setApiGlobalErrorHandler(setLastError);
    const delay = deferHealthCheck ? 4000 : 1500;
    const t = window.setTimeout(() => {
      void checkApi();
    }, delay);
    return () => {
      window.clearTimeout(t);
      setApiGlobalErrorHandler(() => {});
    };
  }, [checkApi, deferHealthCheck]);

  // The very first check can lose a race with a backend that's still booting
  // (e.g. the page loaded a beat before `npm run dev:api` finished starting).
  // Without this, that one-time failure sticks forever — the banner never
  // re-checks itself, so starting the API afterwards doesn't clear it.
  // Keep retrying quietly in the background until it actually connects.
  useEffect(() => {
    if (apiOk !== false) return;
    const interval = window.setInterval(() => {
      void checkApi();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [apiOk, checkApi]);

  const showDevTools = process.env.NODE_ENV === 'development';

  return (
    <AppStatusContext.Provider
      value={{ apiOk, dbConnected, apiMessage, lastError, clearError, checkApi, isChecking }}
    >
      {(apiOk === false || lastError) && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3">
          <div className="mx-auto max-w-container-max space-y-2">
            {apiOk === false && (
              <ErrorAlert
                title="API not reachable"
                message={apiMessage ?? 'Start the backend: npm run dev:api'}
                onRetry={checkApi}
                hint={`Expected: ${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}`}
              />
            )}
            {lastError && apiOk === true && (
              <ErrorAlert
                title="Request failed"
                message={lastError.message}
                onRetry={() => {
                  clearError();
                  checkApi();
                }}
              />
            )}
          </div>
        </div>
      )}
      {apiOk === true && apiMessage && !lastError && (
        <p className="sr-only" aria-live="polite">
          {apiMessage}
        </p>
      )}
      {children}
    </AppStatusContext.Provider>
  );
}
