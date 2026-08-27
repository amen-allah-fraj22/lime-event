'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';

/**
 * Completes a Google OAuth redirect for both sign-in AND sign-up.
 *
 * Clerk's built-in <AuthenticateWithRedirectCallback> only completes the
 * flow you *started* — since "Continue with Google" on the sign-in page
 * calls signIn.authenticateWithRedirect, a Google account with no matching
 * LIME user came back as a bare failure: no account created, no explanation,
 * just bounced to /sign-in. Google had already verified the identity; there
 * was no reason to make the user go create a password-based account from
 * scratch.
 *
 * Clerk's own fix for this is "OAuth account transfer": after the redirect,
 * signIn.status is 'transferable' when the identity is verified but unknown.
 * We detect that, tell the user what's happening, and complete it as a
 * sign-up using the same already-verified Google identity — no separate
 * password step needed.
 */
export default function SSOCallbackPage() {
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const router = useRouter();
  const [status, setStatus] = useState<'working' | 'creating' | 'error'>('working');

  useEffect(() => {
    if (
      !signInLoaded ||
      !signUpLoaded ||
      !signIn ||
      !signUp ||
      !setActiveSignIn ||
      !setActiveSignUp
    ) {
      return;
    }
    // Narrow once, outside the closure — TS doesn't carry the outer null
    // checks into the nested async function below.
    const si = signIn;
    const su = signUp;
    const activateSignIn = setActiveSignIn;
    const activateSignUp = setActiveSignUp;

    let cancelled = false;

    async function complete() {
      try {
        if (si.status === 'complete') {
          await activateSignIn({ session: si.createdSessionId });
          if (!cancelled) router.replace('/dashboard');
          return;
        }

        if (si.firstFactorVerification?.status === 'transferable') {
          if (!cancelled) setStatus('creating');
          const res = await su.create({ transfer: true });
          if (res.status === 'complete') {
            await activateSignUp({ session: res.createdSessionId });
            if (!cancelled) router.replace('/onboarding/role');
            return;
          }
        }

        if (su.status === 'complete') {
          await activateSignUp({ session: su.createdSessionId });
          if (!cancelled) router.replace('/onboarding/role');
          return;
        }

        if (!cancelled) {
          setStatus('error');
          setTimeout(() => router.replace('/sign-in'), 2500);
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setTimeout(() => router.replace('/sign-in'), 2500);
        }
      }
    }

    void complete();
    return () => {
      cancelled = true;
    };
  }, [signInLoaded, signUpLoaded, signIn, signUp, setActiveSignIn, setActiveSignUp, router]);

  const label =
    status === 'creating'
      ? "No account found for this email — creating one for you…"
      : status === 'error'
        ? 'Something went wrong. Redirecting you back to sign in…'
        : 'Finishing sign in…';

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <LoadingBlock label={label} />
    </div>
  );
}
