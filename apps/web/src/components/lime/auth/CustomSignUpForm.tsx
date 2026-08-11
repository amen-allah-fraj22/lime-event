'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';
import { GoogleLogo } from './GoogleLogo';
import { type AuthRole } from './RoleTabs';

const inputWrap =
  'flex items-center gap-2 rounded-lg border-2 border-surface-variant bg-surface-container-lowest px-3 transition-colors focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary-container/30';
const inputBase =
  'h-11 w-full bg-transparent text-body-md text-custom-dark placeholder:text-secondary focus:outline-none';
const labelBase = 'mb-1.5 block font-body text-label-md font-medium text-custom-dark';

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-body-sm text-red-700"
    >
      <MaterialIcon name="error" size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function extractError(err: unknown, fallback: string): string {
  const clerkErr = err as { errors?: { longMessage?: string; message?: string }[] };
  return clerkErr?.errors?.[0]?.longMessage || clerkErr?.errors?.[0]?.message || fallback;
}

export function CustomSignUpForm({ role }: { role: AuthRole }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        username,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        unsafeMetadata: { role },
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/onboarding/role');
        return;
      }

      // Most Clerk instances require email verification before completing sign-up.
      if (result.unverifiedFields?.includes('email_address') || result.status === 'missing_requirements') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify');
        setSubmitting(false);
      } else {
        setError('Additional verification is required to finish creating your account.');
        setSubmitting(false);
      }
    } catch (err: unknown) {
      setError(extractError(err, 'Unable to create your account. Please check your details and try again.'));
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/onboarding/role');
      } else {
        setError('That code didn’t work. Please check it and try again.');
        setSubmitting(false);
      }
    } catch (err: unknown) {
      setError(extractError(err, 'Invalid or expired code. Please try again.'));
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    setError(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch (err: unknown) {
      setError(extractError(err, 'Could not resend the code. Please try again.'));
    }
  };

  const handleGoogle = async () => {
    if (!isLoaded || googleLoading) return;
    setGoogleLoading(true);
    setError(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding/role',
        unsafeMetadata: { role },
      });
    } catch {
      setError('Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="w-full">
        <p className="mb-6 text-center font-body text-body-md text-secondary">
          We sent a 6-digit code to <span className="font-semibold text-custom-dark">{email}</span>.
          Enter it below to verify your email.
        </p>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="code" className={labelBase}>
              Verification code
            </label>
            <div className={inputWrap}>
              <MaterialIcon name="pin" size={20} className="text-secondary" />
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className={cn(inputBase, 'tracking-[0.3em]')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isLoaded}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container font-body text-label-lg font-semibold text-custom-dark transition hover:brightness-95 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <MaterialIcon name="progress_activity" className="animate-spin" size={20} />
                Verifying…
              </>
            ) : (
              <>
                Verify email
                <MaterialIcon name="arrow_forward" size={20} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            className="w-full text-center font-body text-body-sm text-secondary hover:text-custom-dark hover:underline"
          >
            Didn&apos;t get a code? Resend
          </button>
        </form>
      </div>
    );
  }

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
        <span className="font-body text-label-sm uppercase tracking-wide text-secondary">or</span>
        <span className="h-px flex-1 bg-surface-variant" />
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={labelBase}>
              First name
            </label>
            <div className={inputWrap}>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={inputBase}
              />
            </div>
          </div>
          <div>
            <label htmlFor="lastName" className={labelBase}>
              Last name
            </label>
            <div className={inputWrap}>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={inputBase}
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="username" className={labelBase}>
            Username
          </label>
          <div className={inputWrap}>
            <MaterialIcon name="alternate_email" size={20} className="text-secondary" />
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              className={inputBase}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelBase}>
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
          <label htmlFor="password" className={labelBase}>
            Password
          </label>
          <div className={inputWrap}>
            <MaterialIcon name="lock" size={20} className="text-secondary" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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

        {/* Required by Clerk Smart CAPTCHA when bot protection is enabled */}
        <div id="clerk-captcha" />

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
              Creating account…
            </>
          ) : (
            <>
              Continue
              <MaterialIcon name="arrow_forward" size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
