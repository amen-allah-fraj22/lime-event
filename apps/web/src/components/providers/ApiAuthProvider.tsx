'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { registerAuthTokenGetter } from '@/lib/api';

/** Registers Clerk token on API client only — user sync is handled in UserSessionProvider. */
export function ApiAuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      registerAuthTokenGetter(null);
      return;
    }
    registerAuthTokenGetter(() => getToken());
  }, [getToken, isLoaded, isSignedIn]);

  return <>{children}</>;
}
