'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import api from '@/lib/api';
import { ensureDatabaseUser } from '@/lib/auth-sync';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function ArtistEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [profileId, setProfileId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [genres, setGenres] = useState('');
  const [pricingMin, setPricingMin] = useState(0);
  const [pricingMax, setPricingMax] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(`/artists/${id}/edit`)}`);
      return;
    }
    if (!id || !user) return;

    let cancelled = false;
    (async () => {
      setPageLoading(true);
      setError(null);
      try {
        const me = await ensureDatabaseUser(user, getToken);
        const myProfileId = me.artist_profile?.id as string | undefined;
        if (!myProfileId || myProfileId !== id) {
          if (!cancelled) {
            setError('You can only edit your own artist profile.');
            setPageLoading(false);
          }
          return;
        }

        const res = await api.get(`/artists/${id}`);
        if (cancelled) return;
        setProfileId(res.data.id);
        setDisplayName(res.data.display_name);
        setBio(res.data.bio ?? '');
        setCity(res.data.city ?? '');
        setGenres((res.data.genres ?? []).join(', '));
        setPricingMin(res.data.pricing_min ?? 0);
        setPricingMax(res.data.pricing_max ?? 0);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err).message);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, id, isLoaded, isSignedIn, router, user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profileId) return;
    setLoading(true);
    setError(null);
    try {
      await ensureDatabaseUser(user, getToken);
      await api.patch(`/artists/${profileId}`, {
        display_name: displayName,
        bio,
        city,
        genres: genres.split(',').map((g) => g.trim()).filter(Boolean),
        pricing_min: pricingMin,
        pricing_max: pricingMax,
      });
      router.push(`/artists/${id}`);
    } catch (err) {
      setError(getApiErrorMessage(err).message);
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded || pageLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingBlock label="Loading profile…" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href={`/artists/${id}`} className="text-sm font-semibold text-brand-accent">
          ← Profile
        </Link>
        <h1 className="mt-4 font-headline text-3xl font-bold">Edit profile</h1>
        {error && !profileId ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : (
          <form onSubmit={save} className="lime-card mt-8 space-y-5 p-6">
            <div>
              <label className="text-xs font-semibold uppercase text-brand-accent">Display name</label>
              <input className="lime-input mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-brand-accent">Bio</label>
              <textarea className="lime-input mt-1 min-h-[100px]" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-brand-accent">City</label>
              <input className="lime-input mt-1" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-brand-accent">Genres (comma-separated)</label>
              <input className="lime-input mt-1" value={genres} onChange={(e) => setGenres(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-brand-accent">Min price (TND)</label>
                <input type="number" className="lime-input mt-1" value={pricingMin} onChange={(e) => setPricingMin(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-brand-accent">Max price (TND)</label>
                <input type="number" className="lime-input mt-1" value={pricingMax} onChange={(e) => setPricingMax(Number(e.target.value))} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading || !profileId} className="lime-btn-primary w-full">
              {loading ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
