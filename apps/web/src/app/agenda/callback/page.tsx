'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import api from '@/lib/api';
import { useDbUser } from '@/components/providers/UserSessionProvider';

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: dbUser } = useDbUser();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setTimeout(() => router.push('/agenda'), 3000);
      return;
    }

    if (code && dbUser?.id) {
      api.post(`/calendar/${dbUser.id}/google/callback`, { code })
        .then(() => {
          setStatus('success');
          setTimeout(() => router.push('/agenda'), 2000);
        })
        .catch(() => {
          setStatus('error');
          setTimeout(() => router.push('/agenda'), 3000);
        });
    }
  }, [searchParams, dbUser, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-lowest p-6 text-center">
      <div className="mb-6 rounded-full bg-surface-container p-4">
        {status === 'loading' && (
          <MaterialIcon name="sync" className="animate-spin text-primary" size={48} />
        )}
        {status === 'success' && (
          <MaterialIcon name="check_circle" className="text-green-500" size={48} />
        )}
        {status === 'error' && (
          <MaterialIcon name="error" className="text-error" size={48} />
        )}
      </div>

      <h1 className="font-headline text-headline-md font-bold text-on-surface">
        {status === 'loading' && 'Connecting to Google Calendar...'}
        {status === 'success' && 'Connection Successful!'}
        {status === 'error' && 'Failed to Connect'}
      </h1>

      <p className="mt-2 text-body-lg text-secondary">
        {status === 'loading' && 'Please wait while we securely link your account.'}
        {status === 'success' && 'Redirecting you back to your agenda...'}
        {status === 'error' && 'Something went wrong. Redirecting back...'}
      </p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><MaterialIcon name="sync" className="animate-spin text-primary" size={48} /></div>}>
      <GoogleCallbackHandler />
    </Suspense>
  );
}
