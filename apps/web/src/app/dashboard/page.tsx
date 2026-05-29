'use client';

import { ArtistDashboard } from '@/components/lime/dashboard/ArtistDashboard';
import { OrganizerDashboard } from '@/components/lime/dashboard/OrganizerDashboard';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { useRole } from '@/context/RoleContext';

export default function DashboardPage() {
  const { activeRole } = useRole();

  if (!activeRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingBlock label="Loading dashboard…" />
      </div>
    );
  }

  if (activeRole === 'artist') {
    return <ArtistDashboard />;
  }

  if (activeRole === 'organizer' || activeRole === 'agency') {
    return <OrganizerDashboard />;
  }

  return <OrganizerDashboard />;
}
