'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
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

const TABS = ['overview', 'verification', 'users', 'bookings'] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
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

  return (
    <AppShell>
      <div className="mx-auto max-w-container-max space-y-6 px-4 py-10">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight">Admin</h1>
          <p className="mt-2 text-secondary">High-level metrics and system health monitoring.</p>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-surface-variant bg-surface-container-low p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-secondary hover:bg-surface-container-highest'
              }`}
            >
              {t}
              {t === 'verification' && stats && stats.artist_verification.pending > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white">
                  {stats.artist_verification.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab stats={stats} />}
        {tab === 'verification' && (
          <VerificationTab
            loading={pendingLoading}
            artists={pendingArtists}
            actioningId={actioningId}
            onApprove={verifyArtist}
            onReject={rejectArtist}
          />
        )}
        {tab === 'users' && <UsersTab users={users} onToggleActive={toggleUser} />}
        {tab === 'bookings' && <BookingsTab bookings={bookings} />}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  iconWrapClassName,
  iconClassName,
  label,
  value,
  progress,
}: {
  icon: string;
  iconWrapClassName: string;
  iconClassName: string;
  label: string;
  value: string | number;
  progress?: number;
}) {
  return (
    <div className="dashboard-shadow relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-surface-variant/50 bg-surface-container-lowest p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${iconWrapClassName}`}>
        <MaterialIcon name={icon} className={iconClassName} />
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-secondary">{label}</p>
        <h3 className="font-headline text-2xl font-bold text-on-surface">{value}</h3>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full rounded-full bg-primary-container"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

function OverviewTab({ stats }: { stats: DashboardStats | null }) {
  if (!stats) {
    return (
      <p className="text-secondary">Admin access required — set your user role to admin in Prisma Studio.</p>
    );
  }

  const visitorBars = [
    { label: 'Today', value: stats.visitors.today },
    { label: '7d', value: stats.visitors.last_7_days },
    { label: '30d', value: stats.visitors.last_30_days },
  ];
  const maxVisitor = Math.max(1, ...visitorBars.map((b) => b.value));

  const roleRows = [
    {
      icon: 'mic',
      label: 'Artists',
      value: stats.accounts_by_role.artist,
      split: stats.accounts_by_role.artist > 0
        ? (stats.artist_verification.verified / stats.accounts_by_role.artist) * 100
        : 0,
    },
    { icon: 'storefront', label: 'Organizers', value: stats.accounts_by_role.organizer, split: 100 },
    { icon: 'corporate_fare', label: 'Agencies', value: stats.accounts_by_role.agency, split: 100 },
  ];
  const maxRole = Math.max(1, ...roleRows.map((r) => r.value));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="group"
          iconWrapClassName="bg-primary-container/20"
          iconClassName="text-primary"
          label="Total users"
          value={stats.total_users}
        />
        <StatCard
          icon="calendar_month"
          iconWrapClassName="bg-blue-100"
          iconClassName="text-blue-600"
          label="Active bookings"
          value={stats.active_bookings}
        />
        <StatCard
          icon="fact_check"
          iconWrapClassName="bg-amber-100"
          iconClassName="text-amber-600"
          label="Pending verifications"
          value={stats.artist_verification.pending}
        />
        <StatCard
          icon="pie_chart"
          iconWrapClassName="bg-primary-container/20"
          iconClassName="text-primary"
          label="Avg. artist profile completion"
          value={`${stats.avg_artist_profile_completion}%`}
          progress={stats.avg_artist_profile_completion}
        />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <div className="dashboard-shadow flex flex-col rounded-2xl border border-surface-variant/50 bg-surface-container-lowest p-6">
          <div>
            <h3 className="font-headline text-lg font-bold">Visitors</h3>
            <p className="text-sm text-secondary">Page views across the whole site</p>
          </div>
          <div className="mt-8 flex justify-between gap-6" style={{ height: 140 }}>
            {visitorBars.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-headline text-lg font-bold text-on-surface">{b.value}</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary-container transition-all"
                    style={{ height: `${Math.max(6, (b.value / maxVisitor) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-shadow rounded-2xl border border-surface-variant/50 bg-surface-container-lowest p-6">
          <div className="mb-6">
            <h3 className="font-headline text-lg font-bold">Accounts by role</h3>
            <p className="text-sm text-secondary">Distribution of registered users</p>
          </div>
          <div className="space-y-5">
            {roleRows.map((r) => (
              <div key={r.label}>
                <div className="mb-2 flex items-end justify-between">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name={r.icon} size={20} className="text-secondary" />
                    <span className="text-sm font-medium text-on-surface">{r.label}</span>
                  </div>
                  <span className="font-headline text-lg font-bold text-on-surface">{r.value}</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full bg-primary-container"
                    style={{ width: `${Math.max(0, (r.value / maxRole) * r.split) }%` }}
                  />
                  <div
                    className="h-full bg-surface-container-highest"
                    style={{ width: `${Math.max(0, (r.value / maxRole) * (100 - r.split))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4 text-xs text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-container" />
              Verified
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-surface-container-highest" />
              Pending review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationTab({
  loading,
  artists,
  actioningId,
  onApprove,
  onReject,
}: {
  loading: boolean;
  artists: PendingArtist[];
  actioningId: string | null;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}) {
  if (loading) return <p className="text-secondary">Loading…</p>;
  if (artists.length === 0) {
    return (
      <div className="dashboard-shadow rounded-2xl border border-surface-variant/50 bg-surface-container-lowest p-12 text-center">
        <MaterialIcon name="task_alt" size={40} className="mx-auto mb-3 text-secondary opacity-60" />
        <p className="text-secondary">No artist profiles waiting for review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {artists.map((a) => (
        <article
          key={a.id}
          className="dashboard-shadow relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl border border-surface-variant/50 bg-surface-container-lowest p-6 transition-all hover:shadow-md sm:flex-row"
        >
          <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-400" />
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-outline-variant bg-surface-container-high">
            {a.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.profile_photo_url} alt={a.display_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <MaterialIcon name="person" size={32} className="text-secondary" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-headline text-lg font-bold text-on-surface">{a.display_name}</h3>
            <p className="text-sm text-secondary">{a.user.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-secondary sm:justify-start">
              <span className="flex items-center gap-1">
                <MaterialIcon name="location_on" size={14} />
                {a.city ?? 'No city set'}
              </span>
              <span className="text-outline">•</span>
              <span className="rounded-full bg-surface-container px-2 py-1 capitalize">{a.artist_type}</span>
              <span className="text-outline">•</span>
              <span className="font-bold text-primary">{a.profile_completion}% complete</span>
              <span className="text-outline">•</span>
              <span>Signed up {new Date(a.user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex w-full gap-3 sm:w-auto sm:flex-col">
            <button
              type="button"
              disabled={actioningId === a.user.id}
              onClick={() => onApprove(a.user.id)}
              className="flex-1 rounded-lg bg-primary-container px-6 py-2.5 text-sm font-bold text-on-primary-fixed transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={actioningId === a.user.id}
              onClick={() => onReject(a.user.id)}
              className="flex-1 rounded-lg border-2 border-on-surface px-6 py-2.5 text-sm font-bold transition-colors hover:bg-surface-container disabled:opacity-50 sm:flex-none"
            >
              Reject
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function UsersTab({
  users,
  onToggleActive,
}: {
  users: { id: string; email: string; roles: string[]; is_active: boolean; is_verified: boolean }[];
  onToggleActive: (id: string, field: 'is_active', value: boolean) => void;
}) {
  const roleStyles: Record<string, string> = {
    admin: 'bg-on-surface text-surface-container-lowest',
    organizer: 'bg-primary-container text-on-primary-fixed',
    artist: 'bg-surface-container-high text-on-surface',
    agency: 'bg-surface-container-high text-on-surface',
  };

  return (
    <div className="dashboard-shadow overflow-x-auto rounded-2xl border border-surface-variant/50 bg-surface-container-lowest p-4">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-variant text-xs uppercase tracking-wide text-secondary">
            <th className="py-3 pl-2">Email</th>
            <th>Role</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-surface-variant last:border-0">
              <td className="py-3 pl-2">{u.email}</td>
              <td>
                <div className="flex flex-wrap gap-1.5 py-1">
                  {(u.roles ?? []).map((r) => (
                    <span
                      key={r}
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleStyles[r] ?? 'bg-surface-container-high text-on-surface'}`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={u.is_active}
                  onChange={(e) => onToggleActive(u.id, 'is_active', e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingsTab({
  bookings,
}: {
  bookings: { id: string; status: string; event: { title: string }; artist: { email: string } }[];
}) {
  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-primary-container/30 text-on-primary-fixed',
    contracted: 'bg-primary-container/30 text-on-primary-fixed',
    completed: 'bg-surface-container-high text-secondary',
    declined: 'bg-red-100 text-red-700',
  };

  return (
    <div className="dashboard-shadow divide-y divide-surface-variant overflow-hidden rounded-2xl border border-surface-variant/50 bg-surface-container-lowest">
      {bookings.length === 0 ? (
        <p className="p-8 text-center text-secondary">No bookings yet.</p>
      ) : (
        bookings.map((b) => (
          <div key={b.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-semibold text-on-surface">{b.event.title}</p>
              <p className="text-xs text-secondary">{b.artist.email}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[b.status] ?? 'bg-surface-container-high text-secondary'}`}
            >
              {b.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
