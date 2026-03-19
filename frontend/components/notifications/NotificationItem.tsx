'use client';

import Link from 'next/link';
import { NotificationRecord } from '@/lib/api';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80';

export type NotificationAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
};

interface NotificationItemProps {
  notification: NotificationRecord;
  headline: string;
  body?: string;
  timestamp?: string;
  onMarkRead?: (id: string) => void;
  marking?: boolean;
  actions?: NotificationAction[];
}

const formatTimestamp = (value?: string) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export function NotificationItem({
  notification,
  headline,
  body,
  timestamp,
  onMarkRead,
  marking,
  actions,
}: NotificationItemProps) {
  const isUnread = !notification.read;
  const avatarSrc = notification.actor?.profileImage || FALLBACK_AVATAR;
  const resolvedTimestamp = timestamp || formatTimestamp(notification.createdAt);

  return (
    <div
      className={`flex items-start gap-4 rounded-3xl border border-white/10 p-4 transition ${
        isUnread ? 'bg-white/10' : 'bg-white/5'
      }`}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={notification.actor?.name || 'Member avatar'}
          className="h-14 w-14 rounded-2xl object-cover"
        />
        {isUnread ? (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#F97373]" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 text-white">
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{headline}</p>
          {body ? <p className="text-sm text-white/70">{body}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
          <span>{resolvedTimestamp}</span>
          {isUnread && onMarkRead ? (
            <button
              type="button"
              onClick={() => onMarkRead(notification._id)}
              disabled={marking}
              className="text-white/80 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Mark as read
            </button>
          ) : null}
        </div>

        {actions && actions.length ? (
          <div className="mt-1 flex flex-wrap gap-3">
            {actions.map((action) => {
              const baseClasses =
                action.variant === 'primary'
                  ? 'bg-white text-[#0E1A2F]'
                  : 'border border-white/30 text-white hover:border-white';
              const content = (
                <span className="text-sm font-semibold">{action.label}</span>
              );
              if (action.href) {
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${baseClasses}`}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${baseClasses} disabled:opacity-50`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
