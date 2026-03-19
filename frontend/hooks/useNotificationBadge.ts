'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchNotificationSummary } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export const NOTIFICATION_BADGE_EVENT = 'notification-badge-refresh';

export function useNotificationBadge(pollInterval = 45000) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    try {
      setLoading(true);
      const summary = await fetchNotificationSummary();
      setCount(summary.unreadCount || 0);
    } catch (error) {
      console.error('Unable to fetch notification summary', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!user || !pollInterval || typeof window === 'undefined') {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      refresh();
    }, pollInterval);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, pollInterval, refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handler = () => {
      refresh();
    };
    window.addEventListener(NOTIFICATION_BADGE_EVENT, handler);
    return () => {
      window.removeEventListener(NOTIFICATION_BADGE_EVENT, handler);
    };
  }, [refresh]);

  return { count, refresh, loading };
}
