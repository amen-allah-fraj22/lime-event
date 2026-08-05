'use client';

import { ArtistDashboard } from '@/components/lime/dashboard/ArtistDashboard';
import { OrganizerDashboard } from '@/components/lime/dashboard/OrganizerDashboard';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { useRole } from '@/context/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { activeRole } = useRole();

  const router = useRouter();

  useEffect(() => {
    if (!activeRole) return;
    if (activeRole === 'artist') {
      router.replace('/agenda');
    } else {
      router.replace('/explore/artists');
    }
  }, [activeRole, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <LoadingBlock label="Redirecting…" />
    </div>
  );
}
