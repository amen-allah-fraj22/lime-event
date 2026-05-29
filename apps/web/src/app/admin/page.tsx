'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import api from '@/lib/api';

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'users' | 'bookings' | 'payments'>('overview');
  const [stats, setStats] = useState<{
    total_users: number;
    active_bookings: number;
    total_revenue_tnd: number;
    pending_payouts: number;
  } | null>(null);
  const [users, setUsers] = useState<
    { id: string; email: string; roles: string[]; is_active: boolean; is_verified: boolean }[]
  >([]);
  const [bookings, setBookings] = useState<
    { id: string; status: string; event: { title: string }; artist: { email: string } }[]
  >([]);
  const [payments, setPayments] = useState<
    { id: string; gross_amount: number; status: string; booking_request: { event: { title: string } } }[]
  >([]);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data)).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    if (tab === 'users') api.get('/admin/users').then((r) => setUsers(r.data)).catch(() => setUsers([]));
    if (tab === 'bookings') api.get('/admin/bookings').then((r) => setBookings(r.data)).catch(() => setBookings([]));
    if (tab === 'payments') api.get('/admin/payments').then((r) => setPayments(r.data)).catch(() => setPayments([]));
  }, [tab]);

  async function toggleUser(id: string, field: 'is_active' | 'is_verified', value: boolean) {
    await api.patch(`/admin/users/${id}`, { [field]: value });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  }

  async function markPaid(id: string) {
    await api.patch(`/admin/payments/${id}/paid`);
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'held' } : p)),
    );
  }

  const tabs = ['overview', 'users', 'bookings', 'payments'] as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-container-max px-4 py-10">
        <h1 className="font-headline text-3xl font-bold">Admin</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${
                tab === t ? 'bg-lime-container text-brand-text' : 'bg-white border border-surface-variant'
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats
              ? [
                  ['Total users', stats.total_users],
                  ['Active bookings', stats.active_bookings],
                  ['Revenue (TND)', stats.total_revenue_tnd],
                  ['Pending payouts', stats.pending_payouts],
                ].map(([label, value]) => (
                  <div key={String(label)} className="lime-card p-6">
                    <p className="text-sm text-brand-accent">{label}</p>
                    <p className="mt-2 font-headline text-2xl font-bold">{value}</p>
                  </div>
                ))
              : (
                <p className="col-span-full text-brand-accent">
                  Admin access required — set your user role to admin in Prisma Studio.
                </p>
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
                  <th>Verified</th>
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
                    <td>
                      <input
                        type="checkbox"
                        checked={u.is_verified}
                        onChange={(e) => toggleUser(u.id, 'is_verified', e.target.checked)}
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

        {tab === 'payments' && (
          <ul className="lime-card mt-8 divide-y p-4">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span>
                  {p.booking_request.event.title} — {p.gross_amount} TND ({p.status})
                </span>
                {p.status === 'pending' && (
                  <button type="button" className="text-xs font-semibold text-primary" onClick={() => markPaid(p.id)}>
                    Mark paid
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
