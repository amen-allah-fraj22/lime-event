'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Logo } from '@/components/Logo';
import { RoleSwitcher } from '@/components/lime/RoleSwitcher';
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

export function MobileTopBar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const roleCtx = useRoleOptional();
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

        {/* Center — Page title on desktop, hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          {/* Desktop nav links can go here later if needed */}
        </div>

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
