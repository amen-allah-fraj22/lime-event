'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoleOptional } from '@/context/RoleContext';
import { cn } from '@/lib/utils';
import type { ActiveRole } from '@/lib/roles';

/* ─── Tab configuration per role ─── */

export interface NavTab {
  href: string;
  label: string;
  icon: string;       // Material Symbols Outlined icon name
  isCenter?: boolean;  // Elevated center button
}

const ARTIST_TABS: NavTab[] = [
  { href: '/agenda',          label: 'Agenda',    icon: 'calendar_month' },
  { href: '/profile',         label: 'Profile',   icon: 'person' },
  { href: '/explore/events',  label: 'Explore',   icon: 'explore',  isCenter: true },
  { href: '/requests',        label: 'Requests',  icon: 'inbox' },
  { href: '/messages',        label: 'Messages',  icon: 'chat' },
];

const ORGANIZER_TABS: NavTab[] = [
  { href: '/explore/artists', label: 'Explore',   icon: 'search' },
  { href: '/requests',        label: 'Requests',  icon: 'inbox' },
  { href: '/events/create',   label: 'Post',      icon: 'add_circle', isCenter: true },
  { href: '/messages',        label: 'Messages',  icon: 'chat' },
  { href: '/profile',         label: 'Profile',   icon: 'person' },
];

export const NAV_TABS_BY_ROLE: Record<string, NavTab[]> = {
  artist: ARTIST_TABS,
  organizer: ORGANIZER_TABS,
  agency: ORGANIZER_TABS,
  admin: ORGANIZER_TABS,
};

/* ─── Routes where the bottom nav should be hidden ─── */

const HIDDEN_ROUTES = ['/', '/sign-in', '/sign-up', '/onboarding', '/login', '/signup'];

function shouldHideNav(pathname: string): boolean {
  if (HIDDEN_ROUTES.includes(pathname)) return true;
  // Also hide for sub-routes of auth/onboarding
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return true;
  if (pathname.startsWith('/onboarding')) return true;
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) return true;
  return false;
}

function isTabActive(pathname: string, tabHref: string): boolean {
  if (tabHref === '/profile') {
    // /profile exact or /profile/edit, but NOT /profile/[some-artist-id]
    return pathname === '/profile' || pathname.startsWith('/profile/edit');
  }
  return pathname.startsWith(tabHref);
}

/* ─── Component ─── */

export function MobileBottomNav() {
  const pathname = usePathname();
  const roleCtx = useRoleOptional();
  const activeRole = roleCtx?.activeRole ?? 'organizer';

  if (shouldHideNav(pathname)) return null;

  const tabs = NAV_TABS_BY_ROLE[activeRole] ?? ORGANIZER_TABS;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Frosted glass pill container */}
      <div className="mx-3 mb-2 flex items-end justify-around rounded-2xl border border-white/40 bg-white/80 px-1 py-1 shadow-float backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href);

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative -mt-4 flex flex-col items-center"
              >
                {/* Elevated center circle */}
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200',
                    active
                      ? 'bg-lime scale-110 shadow-[0_4px_20px_rgba(183,213,7,0.5)]'
                      : 'bg-lime/80 hover:bg-lime hover:scale-105',
                  )}
                >
                  <span
                    className="material-symbols-outlined text-[26px] text-white"
                    style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 600" } : undefined}
                  >
                    {tab.icon}
                  </span>
                </div>
                <span
                  className={cn(
                    'mt-0.5 text-[10px] font-semibold transition-colors',
                    active ? 'text-lime-dark' : 'text-brand-accent',
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-transform active:scale-95"
            >
              <span
                className={cn(
                  'material-symbols-outlined text-[22px] transition-all duration-300',
                  active ? 'text-lime-dark -translate-y-1' : 'text-brand-accent hover:text-lime-dark',
                )}
                style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 500" } : undefined}
              >
                {tab.icon}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-300',
                  active ? 'font-bold text-lime-dark' : 'text-brand-accent',
                )}
              >
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {active && (
                <span className="absolute bottom-1 h-1 w-1 animate-in zoom-in rounded-full bg-lime" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
