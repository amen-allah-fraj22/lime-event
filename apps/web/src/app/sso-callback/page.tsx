'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';

export default function SSOCallbackPage() {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingBlock label="Finishing sign in…" />
      </div>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/onboarding/role"
      />
    </>
  );
}
