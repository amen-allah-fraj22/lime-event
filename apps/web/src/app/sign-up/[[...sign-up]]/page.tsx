'use client';

import { SignUp } from '@clerk/nextjs';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StitchAuthLayout, clerkAppearance } from '@/components/lime/auth/StitchAuthLayout';
import { type AuthRole } from '@/components/lime/auth/RoleTabs';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';

function parseRole(param: string | null): AuthRole {
  if (param === 'artist' || param === 'organizer' || param === 'agency') return param;
  return 'organizer';
}

function SignUpContent() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<AuthRole>(() => parseRole(searchParams.get('role')));

  return (
    <StitchAuthLayout mode="sign-up" role={role} onRoleChange={setRole}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding/role"
        unsafeMetadata={{ role }}
        appearance={clerkAppearance}
      />
    </StitchAuthLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading sign up…" />}>
      <SignUpContent />
    </Suspense>
  );
}
