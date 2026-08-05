'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { ErrorAlert } from '@/components/feedback/ErrorAlert';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { DashboardShell } from '@/components/lime/dashboard/DashboardShell';
import { useRole } from '@/context/RoleContext';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

type FilterTab = 'all' | 'unread' | 'bookings' | 'payments';

const BOOKING_TYPES = new Set([
  'booking_request',
  'quote_received',
  'quote_accepted',
  'quote_declined',
]);

const PAYMENT_TYPES = new Set(['payment_released', 'payment_pending']);

function notificationIcon(type: string): { icon: string; className: string } {
  if (type.includes('quote') || type === 'booking_request') {
    return { icon: 'mail', className: 'bg-primary-container/20 text-primary' };
  }
  if (type.includes('message')) {
    return { icon: 'forum', className: 'bg-tertiary-container/20 text-secondary' };
  }
  if (type.includes('contract') || type.includes('signed')) {
    return { icon: 'check_circle', className: 'bg-primary-container/20 text-primary' };
  }
  if (type.includes('payment')) {
    return { icon: 'payments', className: 'bg-secondary-container/30 text-on-secondary-container' };
  }
  return { icon: 'update', className: 'bg-surface-container text-on-surface-variant' };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleString();
}

function actionHref(type: string): string | null {
  if (BOOKING_TYPES.has(type) || type.includes('quote')) return '/dashboard/bookings';
  if (type.includes('contract')) return '/dashboard/bookings';
  if (PAYMENT_TYPES.has(type)) return '/dashboard/bookings';
  return null;
}

function groupNotifications(items: Notification[]) {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const older: Notification[] = [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  for (const n of items) {
    const d = new Date(n.created_at);
    if (d >= startOfToday) today.push(n);
    else if (d >= startOfYesterday) yesterday.push(n);
    else older.push(n);
  }
  return { today, yesterday, older };
}

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const { activeRole } = useRole();
  const [tab, setTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/notifications')
      .then((nRes) => setItems(nRes.data))
      .catch((e) => setError(getApiErrorMessage(e).message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (tab === 'unread') return !n.is_read;
      if (tab === 'bookings') return BOOKING_TYPES.has(n.type) || n.type.includes('booking');
      if (tab === 'payments') return PAYMENT_TYPES.has(n.type) || n.type.includes('payment');
      return true;
    });
  }, [items, tab]);

  const unreadCount = items.filter((n) => !n.is_read).length;
  const grouped = groupNotifications(filtered);
  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      setError(getApiErrorMessage(e).message);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <DashboardShell title="Notifications">
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex gap-8 overflow-x-auto pb-2 md:pb-0">
          {(
            [
              ['all', 'All Notifications'],
              ['unread', `Unread (${unreadCount})`],
              ['bookings', 'Bookings'],
              ['payments', 'Payments'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'whitespace-nowrap font-label-md transition-colors',
                tab === key ? 'tab-active' : 'text-on-surface-variant hover:text-primary',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={markingAll || unreadCount === 0}
          onClick={markAllRead}
          className="flex items-center gap-2 text-sm font-bold text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <MaterialIcon name={unreadCount === 0 ? 'check' : 'done_all'} size={20} />
          {unreadCount === 0 ? 'All caught up!' : 'Mark all as read'}
        </button>
      </div>

      {loading && <LoadingBlock label="Loading notifications…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && filtered.length === 0 && (
        <div className="dashboard-shadow rounded-xl bg-surface-container-lowest p-12 text-center text-secondary">
          No notifications in this filter.
        </div>
      )}

      {!loading &&
        !error &&
        (['today', 'yesterday', 'older'] as const).map((key) => {
          const section = grouped[key];
          if (section.length === 0) return null;
          const label = key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : 'Earlier';
          return (
            <section key={key} className="mb-10 space-y-4">
              <h3 className="px-2 font-label-md uppercase tracking-widest text-secondary">{label}</h3>
              <div className="space-y-3">
                {section.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onMarkRead={() => markRead(n.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
    </DashboardShell>
  );
}

function NotificationCard({
  notification: n,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const { icon, className: iconBg } = notificationIcon(n.type);
  const href = actionHref(n.type);

  return (
    <div
      className={cn(
        'group relative flex items-start gap-4 overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-all hover:shadow-md md:p-6',
        !n.is_read && 'unread-indicator',
      )}
    >
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', iconBg)}>
        <MaterialIcon name={icon} />
      </div>
      <div className="min-w-0 flex-grow">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-on-surface">{n.title}</p>
          <span className="shrink-0 text-xs font-medium text-on-surface-variant">
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p className="mt-1 text-sm text-on-surface-variant">{n.body}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {href && (
            <Link
              href={href}
              onClick={() => !n.is_read && onMarkRead()}
              className="rounded-lg bg-primary-container px-4 py-1.5 text-xs font-bold text-on-primary-container transition-transform hover:scale-105 active:scale-95"
            >
              View
            </Link>
          )}
          {!n.is_read && (
            <button
              type="button"
              onClick={onMarkRead}
              className="rounded-lg border border-outline-variant px-4 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-surface-container"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
