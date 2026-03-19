"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { fetchMatches, type MatchRecord, type UserProfile } from '@/lib/api';

const communityEvents = [
  {
    id: 'virtual-debate',
    title: 'Jollof Wars: Virtual Debate',
    dateLabel: 'Sep 14',
    time: 'Sat · 6:00 PM',
    location: 'Virtual · Cultural',
    badge: 'Virtual',
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'afro-beats',
    title: 'Afro-Beats & Chill: London',
    dateLabel: 'Sep 15',
    time: 'Sun · 5:00 PM',
    location: 'Shoreditch · Meet-up',
    badge: 'Cultural',
    image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80'
  }
];

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80';
const FALLBACK_CARD = 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80';
const MATCH_BATCH_SIZE = 6;

const formatRelativeTime = (iso?: string) => {
  if (!iso) return 'Just now';
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';
  const diff = Date.now() - timestamp;
  if (diff < 60 * 1000) return 'Just now';
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / (60 * 1000)))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const deriveMatchScore = (seed: string, index: number) => {
  const total = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.min(99, 80 + ((total + index * 7) % 18));
};

const computeProfileCompletion = (user?: UserProfile | null) => {
  if (!user) return 35;
  const checks: Array<boolean> = [
    Boolean(user.bio),
    Boolean(user.country),
    Boolean(user.profileImage),
    Boolean(user.gallery && user.gallery.length),
    Boolean(user.interests && user.interests.length)
  ];
  const completed = checks.filter(Boolean).length;
  return Math.min(100, Math.max(35, Math.round((completed / checks.length) * 100)));
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

interface MatchCardProps {
  match: MatchRecord;
  score: number;
  liked: boolean;
  onToggleLike: (matchId: string) => void;
}

const MatchCard = ({ match, score, liked, onToggleLike }: MatchCardProps) => {
  const profile = match.profile;
  const avatar = profile?.profileImage || FALLBACK_CARD;
  return (
    <div className="group rounded-[28px] border border-[#F5D0E6] bg-white/95 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#C65D3B]/40 hover:shadow-xl">
      <div className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={profile?.name || 'Match profile'} className="h-48 w-full object-cover" />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#C65D3B]">{score}% Match</span>
      </div>
      <div className="mt-4 flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold text-[#2B2B2B]">
            {profile?.name || 'New member'}
            {profile?.age ? <span className="text-sm font-normal text-[#8E4B5A]"> · {profile.age}</span> : null}
          </p>
          <p className="text-sm text-[#8E4B5A]">{profile?.country || 'Across Africa'}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggleLike(match._id)}
          className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${liked ? 'border-[#C65D3B] bg-[#C65D3B] text-white' : 'border-[#F5D0E6] text-[#C65D3B] hover:border-[#C65D3B]'}`}
        >
          {liked ? 'Liked' : 'Like'}
        </button>
      </div>
    </div>
  );
};

interface ConversationRowProps {
  id: string;
  name: string;
  snippet: string;
  relativeTime: string;
  avatar?: string;
}

const ConversationRow = ({ id, name, snippet, relativeTime, avatar }: ConversationRowProps) => (
  <Link
    href={`/messages?chat=${id}`}
    className="flex items-center justify-between rounded-3xl border border-[#F5D0E6] px-4 py-3 transition hover:border-[#C65D3B]/50"
  >
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 overflow-hidden rounded-2xl bg-[#FCEFFC]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar || FALLBACK_AVATAR} alt={name} className="h-full w-full object-cover" />
      </div>
      <div>
        <p className="font-semibold text-[#2B2B2B]">{name}</p>
        <p className="text-sm text-[#8E4B5A] line-clamp-1">{snippet}</p>
      </div>
    </div>
    <span className="text-xs text-[#C65D3B]">{relativeTime}</span>
  </Link>
);

const EventCard = ({ event }: { event: (typeof communityEvents)[number] }) => (
  <div className="overflow-hidden rounded-[28px] border border-[#F5D0E6] bg-white shadow-sm">
    <div className="relative h-40 w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#C65D3B]">{event.badge}</span>
    </div>
    <div className="space-y-2 px-5 py-4">
      <p className="text-sm font-semibold text-[#C65D3B]">{event.dateLabel}</p>
      <p className="text-lg font-semibold text-[#2B2B2B]">{event.title}</p>
      <p className="text-sm text-[#8E4B5A]">{event.location}</p>
      <p className="text-xs text-[#C65D3B]">{event.time}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [visibleMatches, setVisibleMatches] = useState(MATCH_BATCH_SIZE);
  const [likedMatches, setLikedMatches] = useState<Set<string>>(new Set());
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const data = await fetchMatches();
        setMatches(data);
      } catch (error) {
        console.error('Unable to load matches', error);
      } finally {
        setLoadingMatches(false);
      }
    };

    loadMatches();
  }, []);

  useEffect(() => {
    setVisibleMatches((prev) => (matches.length ? Math.min(prev, MATCH_BATCH_SIZE) : prev));
  }, [matches.length]);

  useEffect(() => {
    if (!loaderRef.current) return undefined;
    const node = loaderRef.current;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setVisibleMatches((prev) => {
          if (prev >= matches.length) {
            return prev;
          }
          return Math.min(prev + MATCH_BATCH_SIZE, matches.length);
        });
      }
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [matches.length]);

  const handleToggleLike = (matchId: string) => {
    setLikedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  };
  const galleryImages = useMemo(() => (user?.gallery && user.gallery.length ? user.gallery : []), [user?.gallery]);
  const currentAvatar = useMemo(() => {
    if (user?.profileImage) return user.profileImage;
    if (user?.gallery && user.gallery.length) return user.gallery[0];
    return FALLBACK_AVATAR;
  }, [user?.profileImage, user?.gallery]);
  const profileCompletion = useMemo(() => computeProfileCompletion(user), [user]);
  const greetingName = user?.name?.split(' ')[0] || 'Explorer';
  const greeting = `${getGreeting()}, ${greetingName}`;

  const matchCards = useMemo(() => matches.slice(0, visibleMatches), [matches, visibleMatches]);

  const conversationPreviews = useMemo(
    () =>
      matches.slice(0, 4).map((match, index) => ({
        id: match._id,
        name: match.profile?.name || `New rhythm ${index + 1}`,
        snippet: match.profile?.bio || '“Let’s catch the next vinyl swap together!”',
        relativeTime: formatRelativeTime(match.lastMessageAt),
        avatar: match.profile?.profileImage
      })),
    [matches]
  );

  const statCards = useMemo(() => {
    const likesCount = user?.likes?.length ?? 0;
    const matchCount = matches.length;
    const profileViews = Math.max(128, matchCount * 14 + 96);
    return [
      { label: 'Profile Views', value: profileViews },
      { label: 'Likes', value: likesCount }
    ];
  }, [matches.length, user?.likes?.length]);

  return (
    <ProtectedRoute>
      <section className="min-h-screen bg-gradient-to-b from-[#FCE7F3] via-[#FDF2F8] to-[#FFF5F8] pb-16">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          <div className="mt-8 grid gap-8 lg:grid-cols-[320px,1fr]">
            <aside className="space-y-6">
              <div className="rounded-[32px] bg-white p-6 shadow-card">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-[#FDECEF] bg-[#FDECEF]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentAvatar} alt={user?.name || 'Profile avatar'} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#2B2B2B]">{user?.name || 'Amara Okafor'}</p>
                    <p className="text-sm text-[#8E4B5A]">{user?.country || 'Lagos, Nigeria'}</p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="mt-4 block w-full rounded-full bg-[#C65D3B] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm"
                >
                  Edit profile
                </Link>
                <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                  {statCards.map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-[#FFF4F8] p-3">
                      <p className="text-2xl font-semibold text-[#2B2B2B]">{stat.value}</p>
                      <p className="text-xs uppercase tracking-wide text-[#C65D3B]">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-[#8E4B5A]">
                    <span>Profile completion</span>
                    <span>{profileCompletion}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-[#F9D8E7]">
                    <div style={{ width: `${profileCompletion}%` }} className="h-full rounded-full bg-[#C65D3B]" />
                  </div>
                  <p className="mt-3 text-xs text-[#8E4B5A]">Add a voice note to reach 100% and get 3× more matches.</p>
                </div>
              </div>

              <div className="rounded-[32px] bg-gradient-to-br from-[#F8C2D9] via-[#F2A9C4] to-[#F59E9A] p-6 text-white shadow-card">
                <p className="text-sm uppercase tracking-[0.2em]">Premium</p>
                <h3 className="mt-3 text-2xl font-semibold">Find love faster</h3>
                <p className="mt-2 text-sm text-white/90">Upgrade to see who liked you and unlock unlimited matches.</p>
                <button type="button" className="mt-6 w-full rounded-full bg-white/90 px-4 py-3 text-sm font-semibold text-[#C65D3B]">
                  Upgrade now
                </button>
              </div>
            </aside>

            <main className="space-y-8">
              <section className="rounded-[32px] bg-white/90 p-8 shadow-card backdrop-blur">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-[#C65D3B]">
                    We found {Math.max(matches.length || 0, 4)} new hearts that beat to your rhythm.
                  </p>
                  <h1 className="font-display text-3xl text-[#2B2B2B]">{greeting}</h1>
                  <p className="text-sm text-[#8E4B5A]">Showcase your energy and send a first message to keep momentum.</p>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {loadingMatches ? (
                    <p className="text-sm text-[#8E4B5A]">Loading recommended hearts…</p>
                  ) : matchCards.length === 0 ? (
                    <p className="text-sm text-[#8E4B5A]">Like a few profiles to unlock curated matches.</p>
                  ) : (
                    matchCards.map((match, index) => (
                      <MatchCard
                        key={match._id}
                        match={match}
                        score={deriveMatchScore(match._id, index)}
                        liked={likedMatches.has(match._id)}
                        onToggleLike={handleToggleLike}
                      />
                    ))
                  )}
                </div>
                <div ref={loaderRef} className="mt-4 h-6 w-full text-center text-xs text-[#8E4B5A]">
                  {visibleMatches < matches.length ? 'Scroll to load more' : null}
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-[32px] bg-white p-6 shadow-card lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-2xl text-[#2B2B2B]">Recent conversations</h2>
                      <p className="text-sm text-[#8E4B5A]">Wave at friends who already vibe with your interests.</p>
                    </div>
                    <Link href="/messages" className="text-sm font-semibold text-[#C65D3B]">
                      View all
                    </Link>
                  </div>
                  <div className="mt-6 space-y-4">
                    {conversationPreviews.length === 0 ? (
                      <p className="text-sm text-[#8E4B5A]">Start a chat from your matches list to see it here.</p>
                    ) : (
                      conversationPreviews.map((conversation) => (
                        <ConversationRow key={conversation.id} {...conversation} />
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-[32px] bg-white p-6 shadow-card">
                  <h2 className="font-display text-2xl text-[#2B2B2B]">Community events</h2>
                  <p className="text-sm text-[#8E4B5A]">Show up IRL to deepen the spark.</p>
                  <div className="mt-6 space-y-4">
                    {communityEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl text-[#2B2B2B]">Photo moments</h2>
                    <p className="text-sm text-[#8E4B5A]">Keep your gallery fresh for instant trust.</p>
                  </div>
                  <Link href="/profile" className="text-sm font-semibold text-[#C65D3B]">
                    Update gallery
                  </Link>
                </div>
                {galleryImages.length === 0 ? (
                  <p className="mt-4 text-sm text-[#8E4B5A]">Upload photo links inside your profile to let members see your vibe.</p>
                ) : (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryImages.map((image) => (
                      <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#FCEFFC]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="Gallery moment" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </section>
    </ProtectedRoute>
  );
}
