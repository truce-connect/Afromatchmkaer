"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';
import { resolveImageUrl } from '@/lib/utils';

const marketingNavItems = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/discover', label: 'Discover' },
  { href: '/success-stories', label: 'Success Stories' }
];

const appNavItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/matches', label: 'Matches' },
  { href: '/messages', label: 'Messages' },
  { href: '/communities', label: 'Communities' }
];

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80';

const BellIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#8E4B5A]">
    <path
      fill="currentColor"
      d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Zm6.36-5c-.77-.9-1.11-1.95-1.11-3.5V11a5.25 5.25 0 0 0-4-5.13V5a1.25 1.25 0 1 0-2.5 0v.87A5.25 5.25 0 0 0 6.75 11v2.5c0 1.55-.34 2.6-1.11 3.5A1 1 0 0 0 6.47 19h11.06a1 1 0 0 0 .83-1.58Z"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#8E4B5A]">
    <path
      fill="currentColor"
      d="M19.14 12.94a7.36 7.36 0 0 0 .05-.94 7.36 7.36 0 0 0-.05-.94l2.11-1.65a.48.48 0 0 0 .11-.61l-2-3.46a.48.48 0 0 0-.59-.22l-2.49 1a7.1 7.1 0 0 0-1.63-.94l-.38-2.65a.48.48 0 0 0-.48-.41h-4a.48.48 0 0 0-.48.41l-.38 2.65a7.1 7.1 0 0 0-1.63.94l-2.49-1a.48.48 0 0 0-.59.22l-2 3.46a.48.48 0 0 0 .11.61L4.86 11a7.36 7.36 0 0 0-.05.94 7.36 7.36 0 0 0 .05.94l-2.11 1.65a.48.48 0 0 0-.11.61l2 3.46a.48.48 0 0 0 .59.22l2.49-1a7.1 7.1 0 0 0 1.63.94l.38 2.65a.48.48 0 0 0 .48.41h4a.48.48 0 0 0 .48-.41l.38-2.65a7.1 7.1 0 0 0 1.63-.94l2.49 1a.48.48 0 0 0 .59-.22l2-3.46a.48.48 0 0 0-.11-.61Zm-7.14 2a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#8E4B5A]">
    <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.22l3.71-2.99a.75.75 0 1 1 .94 1.17l-4.24 3.42a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19Z" />
  </svg>
);

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { count: unreadNotifications } = useNotificationBadge();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const renderNavLink = (item: { href: string; label: string }, variant: 'marketing' | 'app' = 'marketing') => {
    const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/');
    const baseClasses = 'relative rounded-full px-4 py-2 text-sm font-semibold transition';
    const inactiveColor = variant === 'marketing' ? 'text-[#5C2A5F]' : 'text-[#8E4B5A]';
    const stateClasses = isActive ? 'bg-[#FDF2F8] text-[#C65D3B]' : `${inactiveColor} hover:bg-[#FDF2F8]/70`;
    return (
      <Link key={item.href} href={item.href} className={`${baseClasses} ${stateClasses}`}>
        {item.label}
      </Link>
    );
  };

  const avatarSrc = resolveImageUrl(user?.profileImage) || resolveImageUrl(user?.gallery?.[0]) || FALLBACK_AVATAR;

  return (
    <motion.header
      className="sticky top-0 z-50 border-b border-[#EBC7DA]/70 bg-white/90 backdrop-blur"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight text-[#C56693]">
          <span className="rounded-full bg-[#C65D3B] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">AM</span>
          AfroMatchmaker
        </Link>
        <nav className="flex flex-wrap items-center gap-3">
          {marketingNavItems.map((item) => renderNavLink(item, 'marketing'))}
          {user ? (
            <>
              <span className="hidden h-5 w-px bg-[#EBC7DA] md:block" />
              {appNavItems.map((item) => renderNavLink(item, 'app'))}
            </>
          ) : null}
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Link href="/notifications" className="rounded-full bg-[#FDF2F8] p-2" aria-label="Notifications">
                <BellIcon />
              </Link>
              {unreadNotifications > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#C65D3B] px-1.5 text-center text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              ) : null}
            </div>
            <Link href="/settings" className="rounded-full bg-[#FDF2F8] p-2" aria-label="Settings">
              <SettingsIcon />
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-[#F5D0E6] px-2 py-1"
              >
                <div className="h-9 w-9 overflow-hidden rounded-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarSrc} alt={user.name || 'Profile avatar'} className="h-full w-full object-cover" />
                </div>
                <span className="text-sm font-semibold text-[#8E4B5A]">{user.name?.split(' ')[0] || 'You'}</span>
                <ChevronIcon />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-10 mt-2 w-40 rounded-2xl border border-[#F5D0E6] bg-white p-2 text-sm text-[#5C2A5F] shadow-lg">
                  <Link href="/profile" className="block rounded-xl px-3 py-2 hover:bg-[#FDF2F8]">
                    View profile
                  </Link>
                  <Link href="/settings" className="block rounded-xl px-3 py-2 hover:bg-[#FDF2F8]">
                    Settings
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block rounded-xl px-3 py-2 font-semibold text-[#C65D3B] hover:bg-[#FDF2F8]">
                      Admin Ads
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-left text-[#C65D3B] hover:bg-[#FDF2F8]"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[#5C2A5F]">
              Login
            </Link>
            <Link
              href="/join"
              className="rounded-full bg-[#C56693] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            >
              Join Now
            </Link>
          </div>
        )}
      </div>
    </motion.header>
  );
}
