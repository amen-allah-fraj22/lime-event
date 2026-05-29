'use client';

import { usePathname } from 'next/navigation';
import { ApiAuthProvider } from './ApiAuthProvider';
import { AppStatusProvider } from './AppStatusProvider';
import { UserSessionProvider } from './UserSessionProvider';

/** Routes that should not run API health checks or heavy session work on first paint. */
function isMarketingRoute(pathname: string) {
  if (pathname === '/') return true;
  if (pathname === '/artists') return true;
  if (/^\/artists\/[^/]+$/.test(pathname)) return true;
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return true;
  return false;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const light = isMarketingRoute(pathname);

  return (
    <AppStatusProvider deferHealthCheck={light}>
      <ApiAuthProvider>
        <UserSessionProvider>{children}</UserSessionProvider>
      </ApiAuthProvider>
    </AppStatusProvider>
  );
}
