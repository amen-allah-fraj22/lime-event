'use client';

import { SignIn } from '@clerk/nextjs';
import { StitchAuthLayout, clerkAppearance } from '@/components/lime/auth/StitchAuthLayout';

export default function SignInPage() {
  return (
    <StitchAuthLayout mode="sign-in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      />
    </StitchAuthLayout>
  );
}
