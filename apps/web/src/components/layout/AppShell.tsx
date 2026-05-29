'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Logo } from '@/components/Logo';
import { RoleSwitcher } from '@/components/lime/RoleSwitcher';
import { useRoleOptional } from '@/context/RoleContext';
import { cn } from '@/lib/utils';
import type { ActiveRole } from '@/lib/roles';

const navLinks: { href: string; label: string; roles?: ActiveRole[] }[] = [
  { href: '/artists', label: 'Browse' },
  { href: '/events/new', label: 'Create event', roles: ['organizer', 'agency'] },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/notifications', label: 'Alerts' },
  { href: '/calendar', label: 'Calendar' },
];

const ROLE_LABELS: Record<ActiveRole, string> = {
  artist: 'Artist',
  organizer: 'Organizer',
  agency: 'Agency',
  admin: 'Admin',
};

export function AppShell({
  children,
  showNav = true,
}: {
  children: React.ReactNode;
  showNav?: boolean;
}) {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const roleCtx = useRoleOptional();
  const activeRole = roleCtx?.activeRole;

  if (!showNav) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-50 border-b border-surface-variant bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-4 md:px-10">
          <Logo className="h-9 w-auto" />
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {navLinks.map((link) => {
              if (link.roles && activeRole && !link.roles.includes(activeRole)) return null;
              if (link.roles && !activeRole) return null;
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'font-body text-sm font-semibold transition',
                    active
                      ? 'border-b-2 border-lime pb-0.5 text-primary'
                      : 'text-brand-accent hover:text-primary',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            {roleCtx && <RoleSwitcher />}
            {activeRole && isSignedIn && (
              <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-secondary sm:inline">
                {ROLE_LABELS[activeRole]}
              </span>
            )}
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
              <UserButton afterSignOutUrl="/" />
            )}
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
