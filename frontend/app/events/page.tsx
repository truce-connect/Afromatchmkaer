'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchCommunityEvents,
  fetchNearbyEvents,
  fetchRecommendedEvents,
  fetchTrendingEvents,
  fetchUserEvents,
  type EventQuery,


  
  type EventRecord
} from '@/lib/api';

const EVENT_SECTION_KEYS = ['recommended', 'community', 'user', 'trending', 'nearby'] as const;
type EventShelfKey = (typeof EVENT_SECTION_KEYS)[number];

type EventSectionMeta = {
  title: string;
  subtitle: string;
  badge: string;
  anchor: string;
  tone: 'dark' | 'light';
  containerClass: string;
};

const EVENT_SECTIONS: Record<EventShelfKey, EventSectionMeta> = {
  recommended: {
    title: 'Recommended for you',
    subtitle: 'Signals from your interests, follows, and recent RSVPs',
    badge: 'Personalized',
    anchor: 'recommended',
    tone: 'dark',
    containerClass: 'bg-gradient-to-br from-[#0C0514] via-[#221033] to-[#301741]'
  },
  community: {
    title: 'Community hosted',
    subtitle: 'Official chapters, supper clubs, and studio curated residencies',
    badge: 'Communities',
    anchor: 'community',
    tone: 'light',
    containerClass: 'bg-[#FFF4FA]'
  },
  user: {
    title: 'Hosted by members',
    subtitle: 'Grassroots meetups from people you follow and group chats you are in',
    badge: 'Member-led',
    anchor: 'user',
    tone: 'light',
    containerClass: 'bg-[#F7F4FF]'
  },
  trending: {
    title: 'Trending worldwide',
    subtitle: 'Most talked-about happenings across the AfroMatchmaker ecosystem',
    badge: 'Velocity',
    anchor: 'trending',
    tone: 'dark',
    containerClass: 'bg-gradient-to-br from-[#150B24] via-[#2C1240] to-[#40154E]'
  },
  nearby: {
    title: 'Near you',
    subtitle: 'Pop-up dinners, wellness labs, and culture tours within your orbit',
    badge: 'Local pulse',
    anchor: 'nearby',
    tone: 'light',
    containerClass: 'bg-white'
  }
};

const FALLBACK_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80&sat=-25';

const buildValueMap = <T,>(factory: () => T) =>
  EVENT_SECTION_KEYS.reduce<Record<EventShelfKey, T>>((acc, key) => {
    acc[key] = factory();
    return acc;
  }, {} as Record<EventShelfKey, T>);

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const formatEventWindow = (start?: string, end?: string) => {
  if (!start) return 'Dates coming soon';
  const startDate = new Date(start);
  if (!isValidDate(startDate)) return start;

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const startLabel = `${dayFormatter.format(startDate)} · ${timeFormatter.format(startDate)}`;
  if (!end) return startLabel;

  const endDate = new Date(end);
  if (!isValidDate(endDate)) return startLabel;
  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${startLabel} – ${timeFormatter.format(endDate)}`;
  }
  return `${dayFormatter.format(startDate)} → ${dayFormatter.format(endDate)}`;
};

const getInitials = (value?: string) => {
  if (!value) return 'AM';
  const segments = value.trim().split(' ');
  if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase();
  return (segments[0][0] + segments[segments.length - 1][0]).toUpperCase();
};

const EventSkeleton = ({ tone }: { tone: 'dark' | 'light' }) => (
  <div
    className={`h-80 rounded-[28px] border ${
      tone === 'dark' ? 'border-white/10 bg-white/5' : 'border-[#E0D4F0] bg-white'
    } animate-pulse`}
  />
);

interface EventCardProps {
  event: EventRecord;
  tone: 'dark' | 'light';
}

const EventCard = ({ event, tone }: EventCardProps) => {
  const router = useRouter();
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const isDark = tone === 'dark';

  useEffect(() => {
    if (!shareFeedback) return;
    const timer = window.setTimeout(() => setShareFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [shareFeedback]);

  const handleRsvp = () => {
    router.push(`/events/${event._id}`);
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = event.shareUrl || `${window.location.origin}/events/${event._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied');
      }
    } catch (error) {
      console.error('Share event failed', error);
      setShareFeedback('Unable to share');
    }
  };

  const attendance = event.attendeeCount ?? event.rsvpCount;
  const popularityLabel = attendance
    ? `${attendance.toLocaleString()} attending`
    : event.popularityScore
    ? `Buzz score ${event.popularityScore}`
    : event.capacity
    ? `${event.capacity} seats`
    : 'Fresh drop';

  const locationLabel = event.location || (event.isVirtual ? 'Virtual session' : 'Location TBA');
  const organizerName = event.organizer?.name || event.organizer?.community || 'Community host';
  const organizerAvatar = event.organizer?.avatar || event.organizer?.profileImage;
  const tags = (event.tags || []).slice(0, 3);

  return (
    <article
      className={`flex h-full flex-col rounded-[28px] border ${
        isDark
          ? 'border-white/10 bg-white/5 text-white'
          : 'border-[#E7DFF4] bg-white text-[#1D1129] shadow-[0_25px_70px_rgba(42,11,59,0.07)]'
      } p-5`}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={event.coverImage || FALLBACK_EVENT_IMAGE}
          alt={event.title}
          width={640}
          height={320}
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
          className="h-48 w-full object-cover"
          unoptimized
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isDark ? 'bg-white/20 text-white' : 'bg-[#FDE1F0] text-[#9F2B68]'
            }`}
          >
            {event.hostType === 'partner' ? 'Partner' : event.hostType === 'community' ? 'Community' : 'Member' }
          </span>
          {event.source && (
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white/80">
              {event.source}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-[#6C547C]'}`}>
            {formatEventWindow(event.startsAt, event.endsAt)}
          </p>
          <h3 className="mt-1 text-xl font-semibold leading-tight">{event.title}</h3>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-[#4F3A61]'}`}>{locationLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <span className={isDark ? 'text-white/70' : 'text-[#8B6AA1]'}>{popularityLabel}</span>
          <span className="h-1 w-1 rounded-full bg-current opacity-60" />
          <span className={isDark ? 'text-white/70' : 'text-[#8B6AA1]'}>
            {event.organizer?.community || 'Independent host'}
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-xs ${
                  isDark ? 'bg-white/10 text-white' : 'bg-[#F3E9FF] text-[#5F2DA0]'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border ${
              isDark ? 'border-white/20 bg-white/10' : 'border-[#E3D7F1] bg-[#F9F3FF]'
            }`}
          >
            {organizerAvatar ? (
              <Image
                src={organizerAvatar}
                alt={organizerName}
                width={48}
                height={48}
                sizes="48px"
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#301A44]'}`}>
                {getInitials(organizerName)}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">Hosted by {organizerName}</p>
            <p className={`text-xs ${isDark ? 'text-white/70' : 'text-[#6C547C]'}`}>
              {event.organizer?.title || event.organizer?.community || 'Member curator'}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRsvp}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isDark ? 'bg-white text-[#1B0F25]' : 'bg-[#1B0F25] text-white'
            }`}
          >
            RSVP / Join
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              isDark ? 'border border-white/40 text-white' : 'border border-[#1B0F25]/30 text-[#1B0F25]'
            }`}
          >
            Share
          </button>
          <Link
            href={`/events/${event._id}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold underline-offset-4 hover:underline ${
              isDark ? 'text-white/80' : 'text-[#6A2E83]'
            }`}
          >
            Details
          </Link>
        </div>
        {shareFeedback && (
          <p className={`text-xs ${isDark ? 'text-white/70' : 'text-[#6C547C]'}`}>{shareFeedback}</p>
        )}
      </div>
    </article>
  );
};

interface EventShelfSectionProps {
  meta: EventSectionMeta;
  events: EventRecord[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const EventShelfSection = ({ meta, events, loading, error, onRetry }: EventShelfSectionProps) => (
  <section id={meta.anchor} className={`${meta.containerClass} rounded-[36px] p-8`}> 
    <div className="flex flex-wrap items-center gap-4">
      <span
        className={`text-xs font-semibold uppercase tracking-[0.4em] ${
          meta.tone === 'dark' ? 'text-white/60' : 'text-[#B87FEA]'
        }`}
      >
        {meta.badge}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className={`text-xs font-semibold ${meta.tone === 'dark' ? 'text-white/80' : 'text-[#6A2E83]'}`}
        disabled={loading}
      >
        Refresh
      </button>
    </div>
    <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className={`text-3xl font-semibold ${meta.tone === 'dark' ? 'text-white' : 'text-[#1C0F25]'}`}>
          {meta.title}
        </h2>
        <p className={`text-base ${meta.tone === 'dark' ? 'text-white/70' : 'text-[#4F3A61]'}`}>
          {meta.subtitle}
        </p>
      </div>
    </div>
    {error && (
      <div
        className={`mt-6 rounded-2xl border p-4 text-sm ${
          meta.tone === 'dark'
            ? 'border-white/20 bg-white/10 text-white'
            : 'border-[#F6D9E6] bg-[#FFF4F8] text-[#7E2D4E]'
        }`}
      >
        <p>{error}</p>
        <button
          type="button"
          className="mt-3 rounded-full bg-black/10 px-4 py-2 text-xs font-semibold"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
    )}
    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {loading && [0, 1, 2].map((index) => <EventSkeleton key={index} tone={meta.tone} />)}
      {!loading && events.map((event) => <EventCard key={event._id} event={event} tone={meta.tone} />)}
    </div>
    {!loading && !events.length && !error && (
      <div
        className={`mt-6 rounded-2xl border p-6 text-sm font-semibold ${
          meta.tone === 'dark'
            ? 'border-white/10 bg-white/5 text-white'
            : 'border-dashed border-[#C6B4E9] bg-white text-[#5A3C73]'
        }`}
      >
        No events in this lane yet. Tap refresh to pull new drops as soon as hosts publish them.
      </div>
    )}
  </section>
);

export default function EventsPage() {
  const { user } = useAuth();
  const interestPills = useMemo(() => (user?.interests || []).filter(Boolean).slice(0, 6), [user?.interests]);
  const [activeInterest, setActiveInterest] = useState<string | null>(null);

  useEffect(() => {
    if (!interestPills.length) {
      setActiveInterest(null);
      return;
    }
    if (!activeInterest || !interestPills.includes(activeInterest)) {
      setActiveInterest(interestPills[0]);
    }
  }, [activeInterest, interestPills]);

  const [eventData, setEventData] = useState<Record<EventShelfKey, EventRecord[]>>(() =>
    buildValueMap<EventRecord[]>(() => [])
  );
  const [loadingMap, setLoadingMap] = useState<Record<EventShelfKey, boolean>>(() =>
    buildValueMap<boolean>(() => true)
  );
  const [errorMap, setErrorMap] = useState<Record<EventShelfKey, string | null>>(() =>
    buildValueMap<string | null>(() => null)
  );

  const fetcherMap = useMemo<Record<EventShelfKey, (params?: EventQuery) => Promise<EventRecord[]>>>(
    () => ({
      recommended: fetchRecommendedEvents,
      community: fetchCommunityEvents,
      user: fetchUserEvents,
      trending: fetchTrendingEvents,
      nearby: fetchNearbyEvents
    }),
    []
  );

  const interestPool = useMemo(() => (user?.interests || []).filter(Boolean), [user?.interests]);
  const communities = useMemo(() => (user?.communities || []).filter(Boolean), [user?.communities]);
  const following = useMemo(() => (user?.friends || []).filter(Boolean), [user?.friends]);

  const buildParams = useCallback(
    (key: EventShelfKey): EventQuery => {
      const params: EventQuery = { limit: key === 'trending' ? 6 : 4 };
      const interestList = activeInterest ? [activeInterest] : interestPool.slice(0, 4);
      if (key !== 'trending' && interestList.length) {
        params.interests = interestList.join(',');
      }
      if ((key === 'recommended' || key === 'nearby') && user?.country) {
        params.location = user.country;
      }
      if (key === 'community' && communities.length) {
        params.communityIds = communities.join(',');
      }
      if (key === 'user' && following.length) {
        params.followingIds = following.join(',');
      }
      return params;
    },
    [activeInterest, communities, following, interestPool, user?.country]
  );

  const loadShelf = useCallback(
    async (key: EventShelfKey) => {
      setLoadingMap((prev) => ({ ...prev, [key]: true }));
      setErrorMap((prev) => ({ ...prev, [key]: null }));
      try {
        const data = await fetcherMap[key](buildParams(key));
        setEventData((prev) => ({ ...prev, [key]: data }));
      } catch (error) {
        console.error(`Failed to load ${key} events`, error);
        setErrorMap((prev) => ({
          ...prev,
          [key]: 'We could not load this stream. Please try refreshing.'
        }));
      } finally {
        setLoadingMap((prev) => ({ ...prev, [key]: false }));
      }
    },
    [buildParams, fetcherMap]
  );

  useEffect(() => {
    EVENT_SECTION_KEYS.forEach((key) => {
      void loadShelf(key);
    });
  }, [loadShelf]);

  const locationLabel = user?.country || 'your region';
  const communityCount = user?.communities?.length ?? 0;
  const followingCount = user?.friends?.length ?? 0;
  const activeInterestLabel = activeInterest || 'all interests';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F5F0FF] pb-16">
        <section className="bg-gradient-to-br from-[#05020C] via-[#190A22] to-[#2D1140] text-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Event Intelligence</p>
            <h1 className="mt-6 font-display text-4xl leading-tight md:text-5xl">
              Events built around how you love to connect
            </h1>
            <p className="mt-4 max-w-3xl text-base text-white/80">
              We triangulate studio hosts, partner venues, and members you follow to drop gatherings that feel like
              a homecoming. These picks currently prioritize {locationLabel} plus profiles aligned with {activeInterestLabel}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {interestPills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveInterest(null)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeInterest === null
                      ? 'bg-white text-[#1B0F25]'
                      : 'border border-white/30 text-white hover:bg-white/10'
                  }`}
                >
                  All interests
                </button>
              )}
              {interestPills.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => setActiveInterest(interest)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeInterest === interest ? 'bg-white text-[#1B0F25]' : 'border border-white/30 text-white'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-4 text-sm text-white/70">
              <span className="rounded-full border border-white/30 px-4 py-2 font-semibold">
                Tracking {locationLabel} & global partners
              </span>
              <span className="rounded-full border border-white/20 px-4 py-2 font-semibold">
                {communityCount} communities · {followingCount} follows
              </span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/events/create"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#1B0F25] shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5"
              >
                Host an event
              </Link>
              <p className="text-sm text-white/70">
                Upload your own supper club, studio session, or wellness lab for the community calendar.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl -translate-y-10 px-6">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {EVENT_SECTION_KEYS.map((key) => {
              const meta = EVENT_SECTIONS[key];
              return (
                <a
                  key={key}
                  href={`#${meta.anchor}`}
                  className="rounded-[28px] border border-[#E5DAF4] bg-white/90 p-4 shadow-[0_12px_40px_rgba(28,3,50,0.08)] transition hover:-translate-y-1"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#B87FEA]">{meta.badge}</p>
                  <p className="mt-3 text-base font-semibold text-[#1C0F25]">{meta.title}</p>
                  <p className="mt-1 text-sm text-[#4F3A61]">
                    {meta.subtitle.length > 70 ? `${meta.subtitle.slice(0, 70)}…` : meta.subtitle}
                  </p>
                </a>
              );
            })}
          </div>
        </section>

        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
          {EVENT_SECTION_KEYS.map((key) => (
            <EventShelfSection
              key={key}
              meta={EVENT_SECTIONS[key]}
              events={eventData[key]}
              loading={loadingMap[key]}
              error={errorMap[key]}
              onRetry={() => {
                void loadShelf(key);
              }}
            />
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
