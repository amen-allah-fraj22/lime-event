'use client';

import { usePathname } from 'next/navigation';
import { MobileTopBar } from './MobileTopBar';
import { MobileBottomNav } from './MobileBottomNav';

/* Routes that render their own full-screen layout (no shell) */
const SHELL_EXCLUDED = ['/', '/sign-in', '/sign-up', '/onboarding', '/login', '/signup'];

function isExcluded(pathname: string): boolean {
  if (SHELL_EXCLUDED.includes(pathname)) return true;
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return true;
  if (pathname.startsWith('/onboarding')) return true;
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) return true;
  return false;
}

export function AppShell({
  children,
  showNav = true,
}: {
  children: React.ReactNode;
  showNav?: boolean;
}) {
  const pathname = usePathname();
  const excluded = isExcluded(pathname);

  // For landing, auth, and onboarding pages — render children directly
  if (!showNav || excluded) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Top bar — slim header with logo + notifications + avatar */}
      <MobileTopBar />

      {/* Main content — padded at bottom on mobile to clear the bottom nav */}
      <main className="flex-1 pb-24 md:pb-6">
        {children}
      </main>

      {/* Bottom navigation — mobile only (hidden on md+) */}
      <MobileBottomNav />
    </div>
  );
}
