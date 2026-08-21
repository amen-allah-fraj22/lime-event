'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton, useUser } from '@clerk/nextjs';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { RoleSwitcher } from '@/components/lime/RoleSwitcher';
import { useRole } from '@/context/RoleContext';
import { cn } from '@/lib/utils';
import type { ActiveRole } from '@/lib/roles';

import { MobileTopBar } from '@/components/layout/MobileTopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: string;
  roles?: ActiveRole[];
};

const ORGANIZER_NAV: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/explore/artists', label: 'Explore', icon: 'search' },
  {
    href: '/dashboard/events',
    label: 'My Events',
    icon: 'event_seat',
    roles: ['organizer', 'agency'],
  },
  { href: '/dashboard/bookings', label: 'Bookings', icon: 'book_online' },
  { href: '/requests', label: 'Requests', icon: 'inbox' },
  { href: '/messages', label: 'Messages', icon: 'chat' },
  { href: '/notifications', label: 'Notifications', icon: 'notifications' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
];

const ARTIST_NAV: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/explore/events', label: 'Explore', icon: 'explore' },
  { href: '/artists/me', label: 'Profile', icon: 'person', roles: ['artist'] },
  { href: '/dashboard/bookings', label: 'Bookings', icon: 'event_seat' },
  { href: '/requests', label: 'Requests', icon: 'inbox' },
  { href: '/messages', label: 'Messages', icon: 'chat' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { href: '/notifications', label: 'Notifications', icon: 'notifications' },
];

const ROLE_LABELS: Record<ActiveRole, string> = {
  artist: 'Artist',
  organizer: 'Organizer',
  agency: 'Agency',
  admin: 'Admin',
};

export function DashboardShell({
  children,
  title,
  subtitle,
  showNewEvent = false,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showNewEvent?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { activeRole, hasRole } = useRole();
  const nav =
    activeRole === 'artist' ? ARTIST_NAV : ORGANIZER_NAV;
  const canCreateEvent = hasRole('organizer') || hasRole('agency');

  const displayName =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    'User';

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      <div className="md:hidden">
        <MobileTopBar />
      </div>

      <aside className="dashboard-shadow fixed left-0 top-0 z-50 hidden md:flex h-screen w-64 flex-col bg-surface-container-lowest py-2">
        <div className="px-6 py-8">
          <Link href="/dashboard" className="font-headline text-headline-md font-bold text-primary">
            LIME Event
          </Link>
          <p className="text-label-sm text-secondary opacity-70">Talent Marketplace</p>
        </div>

        <div className="px-4 pb-4">
          <RoleSwitcher className="w-full justify-center" />
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {nav.map((item) => {
            if (item.roles && !item.roles.includes(activeRole)) return null;
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200',
                  active
                    ? 'dashboard-active-nav rounded-r-lg font-bold text-primary'
                    : 'text-secondary hover:bg-surface-container',
                )}
              >
                <MaterialIcon name={item.icon} size={22} />
                <span className="text-label-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 px-4 pb-8">
          {showNewEvent && canCreateEvent && (
            <Link
              href="/events/create"
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-3 font-bold text-on-primary-fixed transition-all hover:opacity-90 active:scale-95"
            >
              <MaterialIcon name="add" size={20} />
              New Event
            </Link>
          )}
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-secondary transition-all hover:bg-surface-container"
            >
              <MaterialIcon name="logout" size={22} />
              <span className="text-label-md">Logout</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* pb includes the safe-area inset because MobileBottomNav adds that on
          top of its own height — see the note in AppShell. */}
      <main className="md:ml-64 flex-1 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-20">
        <header className="dashboard-shadow sticky top-0 z-40 hidden md:flex h-16 items-center justify-between bg-surface px-margin-mobile md:px-margin-desktop">
          <div className="max-w-xl flex-1">
            <div className="relative flex items-center">
              <MaterialIcon
                name="search"
                size={20}
                className="absolute left-3 text-secondary"
              />
              <input
                type="search"
                placeholder="Search events or artists..."
                className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-body-md focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>
          <div className="ml-6 flex items-center gap-4">
            <RoleSwitcher />
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="text-secondary transition-colors hover:text-primary"
            >
              <MaterialIcon name="notifications" />
            </Link>
            <div className="flex items-center gap-3 border-l border-outline-variant pl-6">
              <div className="text-right">
                <p className="text-label-md text-on-surface">{displayName}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                  {ROLE_LABELS[activeRole]}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-lime/30 font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop">
          <div className="mb-10">
            <h2 className="font-headline text-headline-lg text-on-surface">{title}</h2>
            {subtitle && <p className="font-body text-body-lg text-secondary">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>

      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
