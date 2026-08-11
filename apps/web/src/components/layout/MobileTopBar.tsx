'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Logo } from '@/components/Logo';
import { RoleSwitcher } from '@/components/lime/RoleSwitcher';
import { NAV_TABS_BY_ROLE } from '@/components/layout/MobileBottomNav';
import { useRoleOptional } from '@/context/RoleContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

/* ─── Routes where the top bar should be hidden ─── */

const HIDDEN_ROUTES_PREFIXES = ['/sign-in', '/sign-up', '/onboarding', '/login', '/signup'];

function shouldHideTopBar(pathname: string): boolean {
  if (pathname === '/') return true; // Landing has its own nav
  return HIDDEN_ROUTES_PREFIXES.some((r) => pathname.startsWith(r));
}

/* ─── Component ─── */

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/profile') {
    return pathname === '/profile' || pathname.startsWith('/profile/edit');
  }
  return pathname.startsWith(href);
}

export function MobileTopBar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const roleCtx = useRoleOptional();
  const activeRole = roleCtx?.activeRole ?? 'organizer';
  const desktopNavTabs = NAV_TABS_BY_ROLE[activeRole] ?? NAV_TABS_BY_ROLE.organizer;
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    api
      .get('/notifications', { skipGlobalError: true })
      .then((res: any) => {
        if (cancelled) return;
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const unread = data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSignedIn, pathname]);

  if (shouldHideTopBar(pathname)) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-surface-variant/60 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-container-max items-center justify-between px-4 md:px-10">
        {/* Left — Logo */}
        <Logo className="h-8 w-auto" />

        {/* Primary nav, desktop only — this is the sole way to reach these
            routes on desktop, since MobileBottomNav hides itself at md+.
            Shares NAV_TABS_BY_ROLE with the bottom nav so the two can't
            drift apart. Only rendered when signed in: signed-out visitors
            get the Log in / Sign up buttons on the right instead. */}
        {isSignedIn && (
          <nav className="hidden md:flex items-center gap-1">
            {desktopNavTabs.map((tab) => {
              const active = isNavActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label-md font-medium transition-colors',
                    active
                      ? 'bg-lime/20 text-lime-dark'
                      : 'text-brand-accent hover:bg-surface-container hover:text-brand-text',
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right — Actions */}
        <div className="flex items-center gap-3">
          {/* Role switcher (desktop only) */}
          {roleCtx && roleCtx.canUseSwitcher && (
            <div className="hidden sm:block">
              <RoleSwitcher />
            </div>
          )}

          {/* Notification bell */}
          {isSignedIn && (
            <Link
              href="/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-container transition hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px] text-brand-text">
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User avatar / Auth buttons */}
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className="text-sm font-semibold text-brand-text">
                Log in
              </Link>
              <Link href="/sign-up" className="lime-btn-primary px-4 py-2 text-sm">
                Sign up
              </Link>
            </>
          ) : (
            <Link
              href="/profile"
              aria-label="Your profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime/20 ring-1 ring-surface-variant transition hover:ring-lime"
            >
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[18px] text-lime-dark">person</span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
