'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useRole } from '@/context/RoleContext';
import { AddRolePromptModal } from '@/components/lime/AddRolePromptModal';
import { SendBookingRequestModal } from '@/components/lime/SendBookingRequestModal';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';

export function SendBookingRequestButton({
  artistUserId,
  artistName,
  signInRedirectPath,
  className,
  label = 'Send booking request',
}: {
  /** User id of the artist (not profile id) — required for POST /booking-requests */
  artistUserId: string;
  artistName: string;
  signInRedirectPath: string;
  className?: string;
  label?: string;
}) {
  const { isSignedIn } = useAuth();
  const { activeRole, hasRole, setActiveRole } = useRole();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const router = useRouter();

  const canBook = hasRole('organizer') || hasRole('agency');

  function openBookingModal() {
    if (hasRole('organizer') && activeRole !== 'organizer' && activeRole !== 'agency') {
      setActiveRole(hasRole('agency') ? 'agency' : 'organizer');
    }
    setShowBookingModal(true);
  }

  function handleClick() {
    if (!artistUserId) return;
    if (!isSignedIn) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(signInRedirectPath)}`,
      );
      return;
    }
    if (!canBook) {
      setShowRoleModal(true);
      return;
    }
    openBookingModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!artistUserId}
        data-testid="send-booking-request-btn"
        className={cn('artist-btn-primary w-full max-w-full', className)}
      >
        <MaterialIcon name="calendar_add_on" size={20} />
        {label}
      </button>

      <AddRolePromptModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onRoleAdded={() => {
          setShowRoleModal(false);
          openBookingModal();
        }}
      />

      {artistUserId && (
        <SendBookingRequestModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          artistUserId={artistUserId}
          artistName={artistName}
        />
      )}
    </>
  );
}
