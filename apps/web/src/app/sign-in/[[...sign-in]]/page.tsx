'use client';

import { StitchAuthLayout } from '@/components/lime/auth/StitchAuthLayout';
import { CustomSignInForm } from '@/components/lime/auth/CustomSignInForm';

export default function SignInPage() {
  return (
    <StitchAuthLayout mode="sign-in">
      <CustomSignInForm />
    </StitchAuthLayout>
  );
}
