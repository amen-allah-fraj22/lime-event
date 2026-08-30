'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import api from '@/lib/api';

type DashboardStats = {
  total_users: number;
  active_bookings: number;
  accounts_by_role: { artist: number; organizer: number; agency: number };
  artist_verification: { verified: number; pending: number };
  avg_artist_profile_completion: number;
  visitors: { today: number; last_7_days: number; last_30_days: number };
};

type PendingArtist = {
  id: string;
  display_name: string;
  city: string | null;
  artist_type: string;
  profile_completion: number;
  profile_photo_url: string | null;
  created_at: string;
  user: { id: string; email: string; created_at: string };
};

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'verification' | 'users' | 'bookings'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<
    { id: string; email: string; roles: string[]; is_active: boolean; is_verified: boolean }[]
  >([]);
  const [bookings, setBookings] = useState<
    { id: string; status: string; event: { title: string }; artist: { email: string } }[]
  >([]);
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setStats(res.data as DashboardStats))
      .catch(() => setStats(null));
  }, []);

  function loadPendingArtists() {
    setPendingLoading(true);
    api
      .get('/admin/artists/pending')
      .then((r) => setPendingArtists(r.data))
      .catch(() => setPendingArtists([]))
      .finally(() => setPendingLoading(false));
  }

  useEffect(() => {
    if (tab === 'users') api.get('/admin/users').then((r) => setUsers(r.data)).catch(() => setUsers([]));
    if (tab === 'bookings') api.get('/admin/bookings').then((r) => setBookings(r.data)).catch(() => setBookings([]));
    if (tab === 'verification') loadPendingArtists();
  }, [tab]);

  async function toggleUser(id: string, field: 'is_active', value: boolean) {
    await api.patch(`/admin/users/${id}`, { [field]: value });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  }

  async function verifyArtist(userId: string) {
    setActioningId(userId);
    try {
      await api.post(`/admin/artists/${userId}/verify`);
      setPendingArtists((prev) => prev.filter((a) => a.user.id !== userId));
    } finally {
      setActioningId(null);
    }
  }

  async function rejectArtist(userId: string) {
    setActioningId(userId);
    try {
      await api.post(`/admin/artists/${userId}/reject`);
      setPendingArtists((prev) => prev.filter((a) => a.user.id !== userId));
    } finally {
      setActioningId(null);
    }
  }

  const tabs = ['overview', 'verification', 'users', 'bookings'] as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-container-max px-4 py-10">
        <h1 className="font-headline text-3xl font-bold">Admin</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`relative rounded-lg px-4 py-2 text-sm font-semibold capitalize ${
                tab === t ? 'bg-lime-container text-brand-text' : 'bg-white border border-surface-variant'
              }`}
              onClick={() => setTab(t)}
            >
              {t}
              {t === 'verification' && stats && stats.artist_verification.pending > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {stats.artist_verification.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="mt-8 space-y-6">
            {!stats ? (
              <p className="text-brand-accent">
                Admin access required — set your user role to admin in Prisma Studio.
              </p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Total users', stats.total_users],
                    ['Active bookings', stats.active_bookings],
                    ['Pending verifications', stats.artist_verification.pending],
                    ['Avg. artist profile completion', `${stats.avg_artist_profile_completion}%`],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="lime-card p-6">
                      <p className="text-sm text-brand-accent">{label}</p>
                      <p className="mt-2 font-headline text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="lime-card p-6">
                  <h3 className="font-headline text-lg font-bold">Visitors</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {[
                      ['Today', stats.visitors.today],
                      ['Last 7 days', stats.visitors.last_7_days],
                      ['Last 30 days', stats.visitors.last_30_days],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <p className="text-sm text-brand-accent">{label}</p>
                        <p className="mt-1 font-headline text-xl font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lime-card p-6">
                  <h3 className="font-headline text-lg font-bold">Accounts by role</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {[
                      ['Artists', stats.accounts_by_role.artist],
                      ['Organizers', stats.accounts_by_role.organizer],
                      ['Agencies', stats.accounts_by_role.agency],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <p className="text-sm text-brand-accent">{label}</p>
                        <p className="mt-1 font-headline text-xl font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-brand-accent">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-lime-container" />
                      {stats.artist_verification.verified} verified
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      {stats.artist_verification.pending} pending review
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'verification' && (
          <div className="mt-8 space-y-4">
            {pendingLoading ? (
              <p className="text-brand-accent">Loading…</p>
            ) : pendingArtists.length === 0 ? (
              <div className="lime-card p-8 text-center text-brand-accent">
                No artist profiles waiting for review.
              </div>
            ) : (
              pendingArtists.map((a) => (
                <div
                  key={a.id}
                  className="lime-card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                    {a.profile_photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.profile_photo_url} alt={a.display_name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{a.display_name}</p>
                    <p className="text-sm text-brand-accent">{a.user.email}</p>
                    <p className="mt-1 text-xs text-brand-accent">
                      {a.city ?? 'No city set'} • {a.artist_type} • {a.profile_completion}% complete • Signed up{' '}
                      {new Date(a.user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex w-full gap-3 sm:w-auto">
                    <button
                      type="button"
                      disabled={actioningId === a.user.id}
                      onClick={() => rejectArtist(a.user.id)}
                      className="flex-1 rounded-lg border-2 border-surface-variant px-4 py-2 text-sm font-bold disabled:opacity-50 sm:flex-none"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={actioningId === a.user.id}
                      onClick={() => verifyArtist(a.user.id)}
                      className="flex-1 rounded-lg bg-lime-container px-4 py-2 text-sm font-bold text-brand-text disabled:opacity-50 sm:flex-none"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="lime-card mt-8 overflow-x-auto p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-brand-accent">
                  <th className="py-2">Email</th>
                  <th>Role</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-surface-variant">
                    <td className="py-2">{u.email}</td>
                    <td>{(u.roles ?? []).join(', ')}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={u.is_active}
                        onChange={(e) => toggleUser(u.id, 'is_active', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'bookings' && (
          <ul className="lime-card mt-8 divide-y p-4">
            {bookings.map((b) => (
              <li key={b.id} className="flex justify-between py-3 text-sm">
                <span>{b.event.title}</span>
                <span className="capitalize text-brand-accent">{b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
