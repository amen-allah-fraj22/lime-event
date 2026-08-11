'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';
import { GoogleLogo } from './GoogleLogo';

export function CustomSignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      } else {
        // e.g. needs email code / 2FA — not enabled in this flow yet
        setError('Additional verification is required to finish signing in.');
        setSubmitting(false);
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { longMessage?: string; message?: string }[] };
      setError(
        clerkErr?.errors?.[0]?.longMessage ||
          clerkErr?.errors?.[0]?.message ||
          'Unable to sign in. Please check your email and password.',
      );
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (!isLoaded || googleLoading) return;
    setGoogleLoading(true);
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const inputWrap =
    'flex items-center gap-2 rounded-lg border-2 border-surface-variant bg-surface-container-lowest px-3 transition-colors focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary-container/30';
  const inputBase =
    'h-11 w-full bg-transparent text-body-md text-custom-dark placeholder:text-secondary focus:outline-none';

  return (
    <div className="w-full">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || submitting || !isLoaded}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border-2 border-surface-variant bg-surface-container-lowest font-body text-label-lg font-medium text-custom-dark transition hover:bg-surface-container disabled:opacity-60"
      >
        {googleLoading ? (
          <MaterialIcon name="progress_activity" className="animate-spin text-secondary" size={20} />
        ) : (
          <GoogleLogo />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-surface-variant" />
        <span className="font-body text-label-sm uppercase tracking-wide text-secondary">
          or
        </span>
        <span className="h-px flex-1 bg-surface-variant" />
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-body-sm text-red-700"
        >
          <MaterialIcon name="error" size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block font-body text-label-md font-medium text-custom-dark"
          >
            Email
          </label>
          <div className={inputWrap}>
            <MaterialIcon name="mail" size={20} className="text-secondary" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputBase}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block font-body text-label-md font-medium text-custom-dark"
            >
              Password
            </label>
          </div>
          <div className={inputWrap}>
            <MaterialIcon name="lock" size={20} className="text-secondary" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputBase}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-secondary transition hover:text-custom-dark"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || googleLoading || !isLoaded}
          className={cn(
            'flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container font-body text-label-lg font-semibold text-custom-dark transition hover:brightness-95 disabled:opacity-60',
          )}
        >
          {submitting ? (
            <>
              <MaterialIcon name="progress_activity" className="animate-spin" size={20} />
              Signing in…
            </>
          ) : (
            <>
              Log in
              <MaterialIcon name="arrow_forward" size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
