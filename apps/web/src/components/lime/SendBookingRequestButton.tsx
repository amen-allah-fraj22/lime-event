'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { AddRolePromptModal } from '@/components/lime/AddRolePromptModal';

export function SendBookingRequestButton({ artistId }: { artistId: string }) {
  const { activeRole, hasRole, setActiveRole } = useRole();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (hasRole('agency')) {
      router.push(`/events/new?artist=${artistId}`);
      return;
    }
    if (hasRole('organizer')) {
      if (activeRole !== 'organizer') setActiveRole('organizer');
      router.push(`/events/new?artist=${artistId}`);
      return;
    }
    setShowModal(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        data-testid="send-booking-request-btn"
        className="lime-btn-primary inline-block"
      >
        Send booking request
      </button>

      <AddRolePromptModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onRoleAdded={() => {
          setShowModal(false);
          router.push(`/events/new?artist=${artistId}`);
        }}
      />
    </>
  );
}
