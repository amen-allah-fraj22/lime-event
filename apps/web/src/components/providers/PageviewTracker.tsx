'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/api';

const SESSION_KEY = 'lime_session_id';

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to a
    // per-load id; it just won't dedupe across page views in that tab.
    return crypto.randomUUID();
  }
}

/** Fires one pageview ping per route change for the admin dashboard's visitor counter. */
export function PageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    api
      .post(
        '/analytics/pageview',
        { path: pathname, session_id: getSessionId() },
        { skipGlobalError: true },
      )
      .catch(() => undefined);
  }, [pathname]);

  return null;
}
