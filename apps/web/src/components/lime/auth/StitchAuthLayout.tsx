'use client';

import Link from 'next/link';
import { AuthBrandPanel } from './AuthBrandPanel';
import { RoleTabs, type AuthRole } from './RoleTabs';

export function StitchAuthLayout({
  mode,
  role,
  onRoleChange,
  children,
}: {
  mode: 'sign-in' | 'sign-up';
  role?: AuthRole;
  onRoleChange?: (role: AuthRole) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-surface font-body text-brand-text">
      <AuthBrandPanel />

      <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-surface-container-lowest p-8 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="mb-6 w-full max-w-md lg:hidden">
          <Link href="/" className="font-headline text-xl font-bold text-custom-dark">
            LIME
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="mb-2 font-headline text-headline-lg text-custom-dark">
              {mode === 'sign-up' ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="font-body text-body-md text-secondary">
              {mode === 'sign-up'
                ? 'Join the freshest talent network.'
                : 'Log in to manage your bookings.'}
            </p>
          </div>

          {mode === 'sign-up' && role && onRoleChange && (
            <RoleTabs value={role} onChange={onRoleChange} />
          )}

          {children}

          <p className="mt-8 text-center font-body text-body-md text-secondary">
            {mode === 'sign-up' ? (
              <>
                Already have an account?{' '}
                <Link href="/sign-in" className="font-bold text-primary hover:underline">
                  Log in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="font-bold text-primary hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
