'use client';'use client';












































































































}  );    </div>      </div>        ) : null}          </div>            })}              );                </button>                  {content}                >                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${baseClasses} disabled:opacity-50`}                  disabled={action.disabled}                  onClick={action.onClick}                  type="button"                  key={action.label}                <button              return (              }                );                  </Link>                    {content}                  >                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${baseClasses}`}                    href={action.href}                    key={action.label}                  <Link                return (              if (action.href) {              );                <span className="text-sm font-semibold">{action.label}</span>              const content = (                  : 'border border-white/30 text-white hover:border-white';                  ? 'bg-white text-[#0E1A2F]'                action.variant === 'primary'              const baseClasses =            {actions.map((action) => {          <div className="mt-1 flex flex-wrap gap-3">        {actions && actions.length ? (        </div>          ) : null}            </button>              Mark as read            >              className="text-white/80 underline-offset-2 hover:underline disabled:opacity-50"              disabled={marking}              onClick={() => onMarkRead(notification._id)}              type="button"            <button          {isUnread && onMarkRead ? (          <span>{resolvedTimestamp}</span>        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">        </div>          {body ? <p className="text-sm text-white/70">{body}</p> : null}          <p className="font-semibold">{headline}</p>        <div className="flex flex-col gap-1">      <div className="flex flex-1 flex-col gap-2 text-white">      </div>        {isUnread ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#F97373]" /> : null}        <img src={avatarSrc} alt={notification.actor?.name || 'Member avatar'} className="h-14 w-14 rounded-2xl object-cover" />        {/* eslint-disable-next-line @next/next/no-img-element */}      <div className="relative">    <div className={`flex items-start gap-4 rounded-3xl border border-white/10 p-4 transition ${isUnread ? 'bg-white/10' : 'bg-white/5'}`}>  return (  const resolvedTimestamp = timestamp || formatTimestamp(notification.createdAt);  const avatarSrc = notification.actor?.profileImage || FALLBACK_AVATAR;  const isUnread = !notification.read;export function NotificationItem({ notification, headline, body, timestamp, onMarkRead, marking, actions }: NotificationItemProps) {};  }    return value;  } catch (_error) {    }).format(new Date(value));      minute: '2-digit'      hour: 'numeric',      day: 'numeric',      month: 'short',    return new Intl.DateTimeFormat('en-US', {  try {  if (!value) return '';const formatTimestamp = (value?: string) => {}  actions?: NotificationAction[];  marking?: boolean;  onMarkRead?: (id: string) => void;  timestamp?: string;  body?: string;  headline: string;  notification: NotificationRecord;interface NotificationItemProps {};  disabled?: boolean;  variant?: 'primary' | 'ghost';  href?: string;  onClick?: () => void;  label: string;export type NotificationAction = {const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80';import { NotificationRecord } from '@/lib/api';import Link from 'next/link';
import Link from 'next/link';
import { NotificationRecord } from '@/lib/api';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80';

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
  actions?: NotificationAction[];
  marking?: boolean;
}

const formatTimestamp = (value?: string) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value));
  } catch (_error) {
    return value;
  }
};

export function NotificationItem({ notification, headline, body, timestamp, onMarkRead, actions = [], marking = false }: NotificationItemProps) {
  const isUnread = !notification.read;
  const avatarSrc = notification.actor?.profileImage || FALLBACK_AVATAR;
  const timeLabel = timestamp || formatTimestamp(notification.createdAt);

  return (
    <div className={`flex gap-4 rounded-3xl border border-white/10 p-4 transition ${isUnread ? 'bg-white/10' : 'bg-white/5'}`}>
      <div className="relative">
        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt={notification.actor?.name || 'User avatar'} className="h-full w-full object-cover" />
        </div>
        {isUnread ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#F472B6] ring-2 ring-[#05020C]" /> : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 text-white">
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-base leading-tight">{headline}</p>
          {body ? <p className="text-sm text-white/70">{body}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
          <span>{timeLabel}</span>
          {isUnread && onMarkRead ? (
            <button
              type="button"
              onClick={() => onMarkRead(notification._id)}
              disabled={marking}
              className="rounded-full border border-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80 disabled:opacity-60"
            >
              {marking ? 'Marking…' : 'Mark as read'}
            </button>
          ) : null}
        </div>
        {actions.length ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => {
              const baseClasses =
                action.variant === 'primary'
                  ? 'bg-white text-[#0E1A2F]'
                  : 'border border-white/30 text-white/80 hover:border-white/70';
              if (action.href) {
                return (
                  <Link
                    key={`${notification._id}-${action.label}`}
                    href={action.href}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${baseClasses}`}
                  >
                    {action.label}
                  </Link>
                );
              }
              return (
                <button
                  key={`${notification._id}-${action.label}`}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${baseClasses}`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
