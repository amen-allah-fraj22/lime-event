'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { StitchAuthLayout } from '@/components/lime/auth/StitchAuthLayout';
import { CustomSignUpForm } from '@/components/lime/auth/CustomSignUpForm';
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
      <CustomSignUpForm role={role} />
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
