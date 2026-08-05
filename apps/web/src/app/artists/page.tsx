'use client';

import { AppShell } from '@/components/layout/AppShell';
import BrowseArtistsPage from '@/components/lime/BrowseArtistsPage';

export default function ArtistsPage() {
  return (
    <AppShell>
      <BrowseArtistsPage />
    </AppShell>
  );
}
