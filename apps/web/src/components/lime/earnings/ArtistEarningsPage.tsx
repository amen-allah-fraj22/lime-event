'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';

type BookingRow = {
  id: string;
  status: string;
  quote_amount?: number | null;
  event: { title: string; event_date: string; city?: string | null };
  payment?: {
    gross_amount: number;
    commission_amount: number;
    net_amount: number;
    status: string;
    released_at?: string | null;
  } | null;
};

const PAID_STATUSES = new Set(['paid', 'released']);

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export function ArtistEarningsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/booking-requests')
      .then((res) => setBookings(res.data))
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const paid = bookings.filter((b) => b.payment && PAID_STATUSES.has(b.payment.status));
    const now = new Date();
    const thisMonthKey = monthKey(now);

    const total = paid.reduce((s, b) => s + (b.payment?.net_amount ?? 0), 0);
    const thisMonth = paid
      .filter((b) => {
        const ref = b.payment?.released_at
          ? new Date(b.payment.released_at)
          : new Date(b.event.event_date);
        return monthKey(ref) === thisMonthKey;
      })
      .reduce((s, b) => s + (b.payment?.net_amount ?? 0), 0);

    const pending = bookings
      .filter((b) => b.payment && !PAID_STATUSES.has(b.payment.status))
      .reduce((s, b) => s + (b.payment?.net_amount ?? 0), 0);

    return { total, thisMonth, pending };
  }, [bookings]);

  const chartMonths = useMemo(() => {
    const labels: { key: string; label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push({
        key: monthKey(d),
        label: d.toLocaleDateString(undefined, { month: 'short' }),
        total: 0,
      });
    }
    for (const b of bookings) {
      if (!b.payment || !PAID_STATUSES.has(b.payment.status)) continue;
      const ref = b.payment.released_at
        ? new Date(b.payment.released_at)
        : new Date(b.event.event_date);
      const key = monthKey(ref);
      const bucket = labels.find((l) => l.key === key);
      if (bucket) bucket.total += b.payment.net_amount;
    }
    const max = Math.max(...labels.map((l) => l.total), 1);
    return labels.map((l) => ({ ...l, heightPct: Math.round((l.total / max) * 100) }));
  }, [bookings]);

  const tableRows = useMemo(() => {
    return bookings
      .filter((b) => b.payment)
      .sort(
        (a, b) =>
          new Date(b.event.event_date).getTime() - new Date(a.event.event_date).getTime(),
      );
  }, [bookings]);

  return (
    <DashboardShell title="Earnings Overview">
      {loading && <LoadingBlock label="Loading earnings…" />}
      {error && <ErrorAlert title="Could not load earnings" message={error} />}

      {!loading && !error && (
        <div className="space-y-gutter">
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            <SummaryCard
              icon="account_balance_wallet"
              iconFilled
              label="Total Earned"
              value={stats.total}
              badge="+ live"
            />
            <SummaryCard
              icon="calendar_month"
              label="This Month"
              value={stats.thisMonth}
              badge="Current"
              badgeMuted
            />
            <SummaryCard icon="schedule" label="Pending Payout" value={stats.pending} />
          </div>

          <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-8">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h4 className="font-headline text-headline-md">Earnings Growth</h4>
                <p className="text-body-md text-secondary">Revenue from paid bookings (last 6 months)</p>
              </div>
            </div>
            <div className="flex h-64 items-end justify-between gap-4 px-4">
              {chartMonths.map((m) => (
                <div key={m.key} className="group flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t-lg bg-surface-container-high transition-all duration-500 group-hover:bg-primary-container/40"
                    style={{
                      height: `${Math.max(m.heightPct, 4)}%`,
                      ...(m.key === monthKey(new Date())
                        ? { backgroundColor: 'rgb(183 213 7)', boxShadow: '0 -4px 10px rgba(183,213,7,0.2)' }
                        : {}),
                    }}
                  />
                  <span
                    className={`mt-3 font-label-md ${m.key === monthKey(new Date()) ? 'font-bold text-on-surface' : 'text-secondary'}`}
                  >
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-shadow overflow-hidden rounded-xl bg-surface-container-lowest">
            <div className="flex items-center justify-between border-b border-surface-variant/30 p-8">
              <h4 className="font-headline text-headline-md">Payment History</h4>
            </div>
            {tableRows.length === 0 ? (
              <p className="px-8 py-10 text-center text-secondary">
                No payments recorded yet. Complete a booking to see earnings here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-8 py-4 font-label-md uppercase text-secondary">Event</th>
                      <th className="px-6 py-4 font-label-md uppercase text-secondary">Date</th>
                      <th className="px-6 py-4 font-label-md uppercase text-secondary">Gross (TND)</th>
                      <th className="px-6 py-4 font-label-md uppercase text-secondary">Commission</th>
                      <th className="px-6 py-4 font-label-md uppercase text-secondary">Net (TND)</th>
                      <th className="px-8 py-4 font-label-md uppercase text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/30">
                    {tableRows.map((b) => {
                      const p = b.payment!;
                      const paid = PAID_STATUSES.has(p.status);
                      return (
                        <tr
                          key={b.id}
                          className="transition-colors duration-150 hover:bg-surface-container-low"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center">
                              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container/20">
                                <MaterialIcon name="music_note" className="text-secondary" />
                              </div>
                              <div>
                                <p className="font-semibold">{b.event.title}</p>
                                <p className="font-label-sm text-secondary">{b.event.city ?? 'Tunisia'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-secondary">
                            {new Date(b.event.event_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 font-medium">{p.gross_amount.toLocaleString()}</td>
                          <td className="px-6 py-5 text-error">
                            -{p.commission_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-5 font-bold text-primary">
                            {p.net_amount.toLocaleString()}
                          </td>
                          <td className="px-8 py-5">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-label-sm font-medium ${
                                paid
                                  ? 'bg-primary-container/20 text-primary'
                                  : 'bg-tertiary-container/40 text-secondary'
                              }`}
                            >
                              <span
                                className={`mr-2 h-1.5 w-1.5 rounded-full ${paid ? 'bg-primary' : 'bg-secondary'}`}
                              />
                              {paid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-center border-t border-surface-variant/30 bg-surface-container-low/30 p-6">
              <Link
                href="/dashboard/bookings"
                className="rounded-lg border-2 border-secondary px-6 py-2 font-label-md text-secondary transition-all hover:bg-secondary hover:text-white"
              >
                View all bookings
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function SummaryCard({
  icon,
  iconFilled,
  label,
  value,
  badge,
  badgeMuted,
}: {
  icon: string;
  iconFilled?: boolean;
  label: string;
  value: number;
  badge?: string;
  badgeMuted?: boolean;
}) {
  return (
    <div className="dashboard-shadow rounded-xl border border-surface-variant/20 bg-surface-container-lowest p-6 transition-all duration-300 hover:scale-[1.01]">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-lg bg-primary-container/10 p-3">
          <MaterialIcon
            name={icon}
            size={28}
            filled={iconFilled}
            className={iconFilled ? 'text-primary' : 'text-secondary'}
          />
        </div>
        {badge && (
          <span
            className={`rounded px-2 py-1 font-label-md ${
              badgeMuted
                ? 'bg-secondary-container/50 text-secondary'
                : 'bg-primary-container/20 text-primary'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="mb-1 font-label-md uppercase tracking-wider text-secondary">{label}</p>
      <h3 className="font-headline text-headline-lg">
        {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
        <span className="text-body-md font-medium text-secondary">TND</span>
      </h3>
    </div>
  );
}
