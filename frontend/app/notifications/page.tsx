'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { NOTIFICATION_BADGE_EVENT } from '@/hooks/useNotificationBadge';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  respondToFriendRequest,
  type NotificationRecord
} from '@/lib/api';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80&sat=-20&exp=-15';
const PAGE_SIZE = 20;

type TabDefinition = {
  id: 'all' | 'unread' | 'messages' | 'community';
  label: string;
  description: string;
  filter?: string;
  category?: string;
};

const tabDefinitions = [
  { id: 'all', label: 'All', description: 'Everything at a glance' },
  { id: 'unread', label: 'Unread', description: 'Needs your attention', filter: 'unread' },
  { id: 'messages', label: 'Messages', description: 'Chats & replies', category: 'messages' },
  { id: 'community', label: 'Community', description: 'Invites & approvals', category: 'community' }
] as const satisfies readonly TabDefinition[];

type TabId = TabDefinition['id'];
type ToastState = { message: string; variant: 'success' | 'error' };

const typeLabels: Record<NotificationRecord['type'], string> = {
  friend_request: 'Friend request',
  friend_accept: 'Connections',
  new_message: 'Message',
  community_invite: 'Community',
  community_join: 'Community',
  profile_view: 'Profile'
};

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Just now';
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 'Just now';
  const diffMs = target.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const intervals: Array<{ limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { limit: 60, divisor: 1, unit: 'second' },
    { limit: 3600, divisor: 60, unit: 'minute' },
    { limit: 86400, divisor: 3600, unit: 'hour' },
    { limit: 604800, divisor: 86400, unit: 'day' },
    { limit: 2629800, divisor: 604800, unit: 'week' },
    { limit: 31557600, divisor: 2629800, unit: 'month' }
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const interval of intervals) {
    if (Math.abs(diffSeconds) < interval.limit) {
      const delta = Math.round(diffSeconds / interval.divisor);
      return rtf.format(delta, interval.unit);
    }
  }
  const years = Math.round(diffSeconds / 31557600);
  return rtf.format(years, 'year');
};

const getMetadataValue = (notification: NotificationRecord, key: string) => {
  const value = notification.metadata?.[key];
  return typeof value === 'string' ? value : undefined;
};

function NotificationBadge({ variant, text }: { variant: 'success' | 'warning'; text: string }) {
  const colors = variant === 'success' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200';
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${colors}`}>{text}</span>;
}

function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [readLoading, setReadLoading] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<ToastState | null>(null);

  const activeFilters = useMemo<TabDefinition>(
    () => tabDefinitions.find((tab) => tab.id === activeTab) ?? tabDefinitions[0],
    [activeTab]
  );

  const emitBadgeRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(NOTIFICATION_BADGE_EVENT));
    }
  }, []);

  const fetchPage = useCallback(
    async (targetPage: number, reset = false) => {
      if (!user) return;
      const params: { filter?: string; category?: string; page?: number; limit?: number } = {
        page: targetPage,
        limit: PAGE_SIZE
      };
      if (activeFilters.filter) {
        params.filter = activeFilters.filter;
      }
      if (activeFilters.category) {
        params.category = activeFilters.category;
      }
      try {
        setError(null);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        const response = await fetchNotifications(params);
        setNotifications((prev) => (reset ? response.results : [...prev, ...response.results]));
        setPage(targetPage);
        setHasNextPage(response.hasNextPage);
        setUnreadCount(response.unreadCount);
      } catch (err) {
        console.error('Notification fetch failed', err);
        setError('Unable to load notifications. Please try again.');
      } finally {
        if (reset) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [user, activeFilters]
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleMarkRead = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return null;
      const target = notifications.find((item) => item._id === notificationId);
      if (!target) return null;
      if (target.read) {
        return target;
      }
      setReadLoading((prev) => ({ ...prev, [notificationId]: true }));
      try {
        const updated = await markNotificationRead(notificationId);
        setNotifications((prev) => prev.map((item) => (item._id === notificationId ? updated : item)));
        setUnreadCount((count) => Math.max(0, count - 1));
        emitBadgeRefresh();
        return updated;
      } catch (err) {
        console.error('Mark read failed', err);
        setToast({ variant: 'error', message: 'Unable to mark notification as read.' });
        return null;
      } finally {
        setReadLoading((prev) => {
          const nextState = { ...prev };
          delete nextState[notificationId];
          return nextState;
        });
      }
    },
    [notifications, emitBadgeRefresh]
  );

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      emitBadgeRefresh();
      setToast({ variant: 'success', message: 'All notifications marked as read.' });
    } catch (err) {
      console.error('Mark all read failed', err);
      setToast({ variant: 'error', message: 'Unable to mark all notifications as read.' });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleFriendRequestAction = async (notification: NotificationRecord, action: 'accept' | 'reject') => {
    const requestId = getMetadataValue(notification, 'requestId');
    if (!requestId) {
      setToast({ variant: 'error', message: 'Missing friend request details.' });
      return;
    }
    setActionLoading((prev) => ({ ...prev, [notification._id]: true }));
    try {
      await respondToFriendRequest({ requestId, action });
      setToast({ variant: 'success', message: action === 'accept' ? 'Friend request accepted.' : 'Friend request rejected.' });
      await handleMarkRead(notification._id);
    } catch (err) {
      console.error('Friend request action failed', err);
      setToast({ variant: 'error', message: 'Unable to update friend request.' });
    } finally {
      setActionLoading((prev) => {
        const nextState = { ...prev };
        delete nextState[notification._id];
        return nextState;
      });
    }
  };

  const handleViewMessage = async (notification: NotificationRecord) => {
    const conversationId = getMetadataValue(notification, 'conversationId');
    if (!conversationId) {
      setToast({ variant: 'error', message: 'Message link unavailable.' });
      return;
    }
    await handleMarkRead(notification._id);
    router.push(`/messages?conversationId=${conversationId}`);
  };

  const handleViewCommunity = async (notification: NotificationRecord) => {
    const communityId = getMetadataValue(notification, 'communityId');
    if (!communityId) {
      setToast({ variant: 'error', message: 'Community link unavailable.' });
      return;
    }
    await handleMarkRead(notification._id);
    router.push(`/communities/${communityId}`);
  };

  const badgeForNotification = (notification: NotificationRecord) => {
    if (notification.type === 'friend_request') {
      return <NotificationBadge variant="warning" text="Pending" />;
    }
    if (!notification.read) {
      return <NotificationBadge variant="warning" text="New" />;
    }
    return <NotificationBadge variant="success" text={typeLabels[notification.type]} />;
  };

  const renderActions = (notification: NotificationRecord) => {
    const isActionLoading = Boolean(actionLoading[notification._id]);
    switch (notification.type) {
      case 'friend_request':
        return (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleFriendRequestAction(notification, 'accept')}
              disabled={isActionLoading}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#120217] disabled:opacity-50"
            >
              {isActionLoading ? 'Updating…' : 'Accept'}
            </button>
            <button
              type="button"
              onClick={() => handleFriendRequestAction(notification, 'reject')}
              disabled={isActionLoading}
              className="rounded-full border border-white/40 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        );
      case 'new_message':
        return (
          <button
            type="button"
            onClick={() => handleViewMessage(notification)}
            className="rounded-full border border-white/40 px-4 py-1.5 text-xs font-semibold text-white hover:border-white"
          >
            View message
          </button>
        );
      case 'community_invite':
      case 'community_join':
        return (
          <button
            type="button"
            onClick={() => handleViewCommunity(notification)}
            className="rounded-full border border-white/40 px-4 py-1.5 text-xs font-semibold text-white hover:border-white"
          >
            View community
          </button>
        );
      case 'friend_accept':
        return notification.actor?._id ? (
          <Link
            href={`/discover?focus=${notification.actor._id}`}
            className="rounded-full border border-white/40 px-4 py-1.5 text-xs font-semibold text-white hover:border-white"
          >
            View profile
          </Link>
        ) : null;
      default:
        return null;
    }
  };

  const renderNotification = (notification: NotificationRecord) => {
    const avatarSrc = notification.actor?.profileImage || FALLBACK_AVATAR;
    const actorName = notification.actor?.name || 'AfroMatchmaker';
    const isUnread = !notification.read;
    return (
      <motion.li
        key={notification._id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative flex gap-4 rounded-3xl border border-white/10 p-4 transition ${isUnread ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5'}`}
      >
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt={actorName} className="h-full w-full object-cover" />
          {isUnread ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#FEC84B]" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{actorName}</p>
            {badgeForNotification(notification)}
          </div>
          <p className="mt-1 text-sm text-white/80">{notification.message}</p>
          <p className="mt-2 text-xs text-white/50">{formatRelativeTime(notification.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {renderActions(notification)}
          {isUnread ? (
            <button
              type="button"
              onClick={() => handleMarkRead(notification._id)}
              disabled={readLoading[notification._id]}
              className="text-xs font-semibold text-white/70 underline-offset-2 hover:text-white disabled:opacity-50"
            >
              {readLoading[notification._id] ? 'Marking…' : 'Mark as read'}
            </button>
          ) : (
            <span className="text-xs text-white/40">Read</span>
          )}
        </div>
      </motion.li>
    );
  };

  return (
    <section className="min-h-screen bg-[#05020C] py-12 text-white">
      <div className="mx-auto max-w-5xl space-y-8 px-4">
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] bg-white/5 p-8 ring-1 ring-white/10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Inbox</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <h1 className="font-display text-4xl">Notifications</h1>
              <p className="mt-2 text-sm text-white/70">
                Stay on top of new connections, community activity, and direct messages.
              </p>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3 text-sm text-white/70">
              <span>{unreadCount} unread</span>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={!unreadCount || markingAll}
                className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                {markingAll ? 'Working…' : 'Mark all read'}
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {tabDefinitions.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col rounded-2xl border px-4 py-3 text-left transition ${
                    isActive ? 'border-white bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <span className="text-sm font-semibold">{tab.label}</span>
                  <span className="text-xs text-white/60">{tab.description}</span>
                </button>
              );
            })}
          </div>
          {toast ? (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${toast.variant === 'success' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-rose-500/10 text-rose-200'}`}
            >
              {toast.message}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </motion.header>

        <motion.section layout className="space-y-4">
          {loading && notifications.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`notification-skeleton-${index}`} className="h-28 rounded-3xl bg-white/5" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-white/70">
              <p className="text-lg font-semibold text-white">You are all caught up</p>
              <p className="mt-2 text-sm">
                Messages, invites, and friend requests will appear here. Discover new members while you wait.
              </p>
              <Link href="/discover" className="mt-4 inline-flex rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217]">
                Explore members
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">{notifications.map((notification) => renderNotification(notification))}</ul>
          )}
        </motion.section>

        {hasNextPage ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fetchPage(page + 1)}
              disabled={loadingMore}
              className="rounded-full border border-white/30 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsScreen />
    </ProtectedRoute>
  );
}
