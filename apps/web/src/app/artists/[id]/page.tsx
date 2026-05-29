'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { SendBookingRequestButton } from '@/components/lime/SendBookingRequestButton';
import api from '@/lib/api';
import { ensureDatabaseUser } from '@/lib/auth-sync';
import { useUser } from '@clerk/nextjs';

export default function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [artist, setArtist] = useState<{
    id: string;
    display_name: string;
    bio?: string;
    city?: string;
    genres: string[];
    pricing_min?: number;
    pricing_max?: number;
    avg_rating: number;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/artists/${id}`).then((res) => setArtist(res.data)).catch(console.error);
    if (!isSignedIn || !user) {
      setMyProfileId(null);
      return;
    }
    ensureDatabaseUser(user, getToken)
      .then((me) => setMyProfileId(me.artist_profile?.id ?? null))
      .catch(() => setMyProfileId(null));
  }, [getToken, id, isSignedIn, user]);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {!artist ? (
          <p>Loading…</p>
        ) : (
          <div className="lime-card overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-lime/40 to-surface-container" />
            <div className="space-y-4 p-6">
              <h1 className="font-headline text-3xl font-bold">{artist.display_name}</h1>
              <p className="text-brand-accent">{artist.city}</p>
              <p>{artist.bio ?? 'No bio yet.'}</p>
              <div className="flex flex-wrap gap-2">
                {artist.genres.map((g) => (
                  <span key={g} className="lime-chip">
                    {g}
                  </span>
                ))}
              </div>
              <p className="font-medium">
                {artist.pricing_min ?? '—'} – {artist.pricing_max ?? '—'} TND · ★{' '}
                {artist.avg_rating.toFixed(1)}
              </p>
              {myProfileId === artist.id ? (
                <Link href={`/artists/${id}/edit`} className="lime-btn-primary inline-block">
                  Edit profile
                </Link>
              ) : isSignedIn ? (
                <SendBookingRequestButton artistId={id} />
              ) : (
                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent(`/artists/${id}`)}`}
                  className="lime-btn-primary inline-block"
                >
                  Sign in to book
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
