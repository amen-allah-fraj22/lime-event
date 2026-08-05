'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import {
  ArtistPublicProfile,
} from '@/components/lime/artist/ArtistPublicProfile';
import type { ArtistProfileFull } from '@/lib/artist-profile-types';
import { ArtistProfileSkeleton } from '@/components/lime/artist/ArtistProfileSkeleton';
import api from '@/lib/api';
import { ensureDatabaseUser } from '@/lib/auth-sync';

export default function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [artist, setArtist] = useState<ArtistProfileFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    api
      .get(`/artists/${id}`)
      .then((res) => {
        if (!cancelled) setArtist(res.data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (!isSignedIn || !user) {
      setMyProfileId(null);
      return () => {
        cancelled = true;
      };
    }

    ensureDatabaseUser(user, getToken)
      .then((me) => {
        if (!cancelled) setMyProfileId(me.artist_profile?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setMyProfileId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [getToken, id, isSignedIn, user]);

  return (
    <AppShell>
      {loading ? (
        <ArtistProfileSkeleton />
      ) : notFound || !artist ? (
        <div className="mx-auto max-w-container-max px-margin-mobile py-24 text-center md:px-margin-desktop">
          <p className="font-headline text-headline-md text-on-surface">Artist not found</p>
          <Link href="/artists" className="mt-4 inline-block text-primary hover:underline">
            Browse artists
          </Link>
        </div>
      ) : (
        <ArtistPublicProfile
          artist={artist}
          isSignedIn={!!isSignedIn}
          isOwner={myProfileId === artist.id}
        />
      )}
    </AppShell>
  );
}
