'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateEventWizard } from '@/components/lime/events/CreateEventWizard';
import { AddRolePromptModal } from '@/components/lime/AddRolePromptModal';
import { useAuth } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';

export default function CreateEventPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { hasRole, activeRole, setActiveRole } = useRole();
  const [ready, setReady] = useState(false);

  const hasOrganizer = hasRole('organizer') || hasRole('agency');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (hasOrganizer && activeRole !== 'organizer' && activeRole !== 'agency') {
      setActiveRole('organizer');
    }
    setReady(true);
  }, [isLoaded, isSignedIn, hasOrganizer, activeRole, setActiveRole]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <p className="text-sm text-secondary">Sign in to create an event.</p>
      </div>
    );
  }

  if (!hasOrganizer) {
    return (
      <AddRolePromptModal
        isOpen
        onClose={() => router.push('/dashboard')}
        onRoleAdded={() => setReady(true)}
      />
    );
  }

  if (!ready) return null;

  return <CreateEventWizard />;
}
