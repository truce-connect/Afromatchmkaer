"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import {
  discoverProfiles,
  fetchCommunities,
  fetchEvents,
  sendFriendRequest,
  type CommunityRecord,
  type DiscoverResponse,
  type EventRecord,
  type UserProfile
} from '@/lib/api';

const PAGE_SIZE = 9;
const HERO_GRADIENT = 'from-[#0E1A2F] via-[#1F3B54] to-[#5B2273]';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80';

const formatDate = (value?: string) => {
  if (!value) return 'Date TBA';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
};

type QueryParams = {
  search?: string;
  country?: string;
  interests?: string;
};

const SectionHeader = ({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F6D7FF]">{eyebrow}</p>
    <h2 className="mt-2 font-display text-3xl text-white">{title}</h2>
    <p className="mt-2 max-w-2xl text-sm text-white/70">{description}</p>
  </div>
);

const VIDEO_FILE_PATTERN = /\.(mp4|webm|ogg|m4v|mov)$/i;

type TimelinePostProps = {
  profile: UserProfile;
  onLike: (profileId: string) => void;
  onPass: (profileId: string) => void;
  onChat: (profileId: string) => void;
  liked: boolean;
  liking: boolean;
};

const TimelinePost = ({ profile, onLike, onPass, onChat, liked, liking }: TimelinePostProps) => {
  const profileId = profile._id || profile.id || '';
  const avatar = profile.profileImage || profile.gallery?.[0] || FALLBACK_IMAGE;
  const mediaGallery =
    profile.gallery && profile.gallery.length > 0 ? profile.gallery : profile.profileImage ? [profile.profileImage] : [];
  const heroMedia = mediaGallery[0] || FALLBACK_IMAGE;
  const supportingMedia = mediaGallery.slice(1, 3);
  const isVideo = VIDEO_FILE_PATTERN.test(heroMedia);
  const statusText = profile.bio ? `${profile.bio.slice(0, 160)}${profile.bio.length > 160 ? '…' : ''}` : 'Showing up with good vibes and ready to meet new people.';
  const interestChips = (profile.interests || []).slice(0, 4);
  const locationLabel = profile.address || profile.country || 'Across Africa';

  return (
    <motion.article
      layout
      className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-white shadow-[0_20px_60px_rgba(5,10,26,0.35)] backdrop-blur"
    >
      <header className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt={profile.name || 'Member avatar'} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">
              {profile.name || 'Community member'}
              {profile.age ? <span className="text-sm text-white/60"> · {profile.age}</span> : null}
            </p>
            <p className="text-sm text-white/60">{locationLabel}</p>
          </div>
        </div>
        <div className="ml-auto text-xs uppercase tracking-[0.3em] text-white/50">Timeline</div>
      </header>

      <p className="mt-4 text-base text-white/80">{statusText}</p>

      <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10">
        {isVideo ? (
          <video src={heroMedia} controls playsInline poster={avatar} className="h-[360px] w-full object-cover" preload="metadata" />
        ) : (
          <img src={heroMedia} alt={`${profile.name || 'Member'} moment`} className="h-[360px] w-full object-cover" />
        )}
      </div>

      {supportingMedia.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {supportingMedia.map((media) => {
            const mediaIsVideo = VIDEO_FILE_PATTERN.test(media);
            return (
              <div key={media} className="overflow-hidden rounded-2xl border border-white/10">
                {mediaIsVideo ? (
                  <video src={media} playsInline muted loop className="h-48 w-full object-cover" preload="metadata" />
                ) : (
                  <img src={media} alt="Gallery moment" className="h-48 w-full object-cover" />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {interestChips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {interestChips.map((chip) => (
            <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              #{chip}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!profileId || liked || liking}
          onClick={() => (profileId ? onLike(profileId) : undefined)}
          className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#10131F] transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {liking ? 'Requesting…' : liked ? 'Request sent' : 'Add friend'}
        </button>
        <button
          type="button"
          disabled={!profileId}
          onClick={() => (profileId ? onChat(profileId) : undefined)}
          className="flex-1 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Chat now
        </button>
        <button
          type="button"
          disabled={!profileId}
          onClick={() => (profileId ? onPass(profileId) : undefined)}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Hide post
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href={profileId ? `/profile/${profileId}` : '#'} className="font-semibold text-white/80 underline-offset-4 hover:text-white">
          View profile
        </Link>
        <span className="text-white/50">Tap to explore their full story</span>
      </div>
    </motion.article>
  );
};

const CommunityCard = ({ community }: { community: CommunityRecord }) => {
  const cover = community.coverImage || FALLBACK_IMAGE;
  return (
    <div className="flex flex-col rounded-3xl bg-[#0F1528] p-5 ring-1 ring-white/5">
      <div className="overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={community.name} className="h-40 w-full object-cover" />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9AD5FF]">Community</p>
        <h3 className="mt-1 text-xl font-semibold text-white">{community.name}</h3>
        <p className="mt-2 text-sm text-white/70">{community.summary || community.description || 'Gather with members who share your passions.'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(community.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-white/50">
          <span>{community.memberCount ? `${community.memberCount.toLocaleString()} members` : 'New circle'}</span>
          <span>{community.location || 'Global'}</span>
        </div>
        <Link
          href={`/communities/${community.slug || community._id}`}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0E1A2F]"
        >
          Join conversation
        </Link>
      </div>
    </div>
  );
};

const EventCard = ({ event }: { event: EventRecord }) => {
  const cover = event.coverImage || FALLBACK_IMAGE;
  const organizerName = event.organizer?.name || 'AfroMatchmaker Host';
  const organizerTitle = event.organizer?.title || event.organizer?.community || 'Community Lead';
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={event.title} className="h-48 w-full object-cover" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#F6D7FF]">Upcoming</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">{event.title}</h3>
        <p className="mt-2 text-sm text-white/70">{event.description || 'Connect with members offline and share new experiences.'}</p>
        <div className="mt-4 grid gap-3 rounded-2xl bg-white/5 p-3 text-sm text-white/80 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">When</p>
            <p>{formatDate(event.startsAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">Where</p>
            <p>{event.location || 'Hybrid / TBA'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">Organizer</p>
            <p>{organizerName}</p>
            <span className="text-xs text-white/50">{organizerTitle}</span>
          </div>
        </div>
        <Link
          href={`/events/${event._id}`}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0E1A2F]"
        >
          View details
        </Link>
      </div>
    </div>
  );
};

export default function DiscoverPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [interest, setInterest] = useState('');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingMoreProfiles, setLoadingMoreProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const [communityError, setCommunityError] = useState<string | null>(null);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const heroName = user?.name?.split(' ')[0] || 'Explorer';

  const searchParams = useMemo(() => {
    const params: QueryParams = {};
    if (query.trim()) params.search = query.trim();
    if (location.trim()) params.country = location.trim();
    if (interest.trim()) params.interests = interest.trim();
    return params;
  }, [interest, location, query]);

  const loadProfiles = useCallback(
    async (reset = false) => {
      const nextPage = reset ? 1 : page + 1;
      if (reset) {
        setLoadingProfiles(true);
      } else {
        setLoadingMoreProfiles(true);
      }
      setProfilesError(null);
      try {
        const response: DiscoverResponse = await discoverProfiles({ ...searchParams, limit: PAGE_SIZE, page: nextPage });
        setProfiles((prev) => (reset ? response.results : [...prev, ...response.results]));
        setHasMore(response.hasNextPage);
        setPage(nextPage);
      } catch (error) {
        console.error('Discover load failed', error);
        setProfilesError('Unable to load members. Please try again.');
      } finally {
        if (reset) {
          setLoadingProfiles(false);
        } else {
          setLoadingMoreProfiles(false);
        }
      }
    },
    [page, searchParams]
  );

  useEffect(() => {
    loadProfiles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadProfiles(true);
  };

  const handleLike = async (profileId: string) => {
    if (!profileId) return;
    setPendingLikes((prev) => {
      const next = new Set(prev);
      next.add(profileId);
      return next;
    });
    try {
      await sendFriendRequest(profileId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.add(profileId);
        return next;
      });
    } catch (error) {
      console.error('Friend request failed', error);
    } finally {
      setPendingLikes((prev) => {
        const next = new Set(prev);
        next.delete(profileId);
        return next;
      });
    }
  };

  const handlePass = (profileId: string) => {
    setProfiles((prev) => prev.filter((profile) => (profile._id || profile.id) !== profileId));
  };

  const handleChat = useCallback(
    (profileId: string) => {
      if (!profileId) return;
      router.push(`/messages?focus=${profileId}`);
    },
    [router]
  );

  const loadMoreProfiles = () => {
    if (!loadingProfiles && !loadingMoreProfiles && hasMore) {
      loadProfiles(false);
    }
  };

  const loadCommunityData = useCallback(async () => {
    setLoadingCommunities(true);
    setCommunityError(null);
    try {
      const response = await fetchCommunities({ limit: 4 });
      setCommunities(response.results);
    } catch (error) {
      console.error('Community fetch failed', error);
      setCommunityError('Communities are resting. Try again soon.');
    } finally {
      setLoadingCommunities(false);
    }
  }, []);

  const loadEventData = useCallback(async () => {
    setLoadingEvents(true);
    setEventError(null);
    try {
      const data = await fetchEvents({ limit: 3 });
      setEvents(data);
    } catch (error) {
      console.error('Event fetch failed', error);
      setEventError('Events failed to load. Refresh to try again.');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadCommunityData();
    loadEventData();
  }, [loadCommunityData, loadEventData]);

  return (
    <ProtectedRoute>
      <section className={`min-h-screen bg-gradient-to-b ${HERO_GRADIENT} py-12`}>
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
          <header className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#F6D7FF]">Discover</p>
            <h1 className="mt-4 font-display text-4xl text-white">Meet the AfroMatchmaker community, {heroName}</h1>
            <p className="mt-3 max-w-3xl text-sm text-white/70">
              Search by name, interest, or location to uncover fresh connections. Explore curated communities and RSVP for upcoming gatherings all in one flow.
            </p>
            <form onSubmit={handleSearch} className="mt-6 grid gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur md:grid-cols-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Search
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, vibe, or keyword"
                  className="mt-1 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Location
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Accra, Lagos, Toronto"
                  className="mt-1 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Interest
                <input
                  value={interest}
                  onChange={(event) => setInterest(event.target.value)}
                  placeholder="Afrobeats, tech, travel"
                  className="mt-1 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
                />
              </label>
              <div className="flex items-end">
                <button type="submit" className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#0E1A2F]">
                  Search members
                </button>
              </div>
            </form>
          </header>

          <section className="rounded-[40px] bg-gradient-to-br from-[#050915] via-[#0C1224] to-[#180921] p-8 text-white shadow-2xl shadow-black/40 ring-1 ring-white/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#7BD5FF]">Timeline</p>
                <h2 className="mt-1 font-display text-3xl">Community stories</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/70">See photos and short clips members have shared, tap into their vibe, and jump straight into a chat when something sparks.</p>
              </div>
              {profilesError ? <p className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-[#FFD3D9]">{profilesError}</p> : null}
            </div>

            <div className="mt-8 space-y-6">
              {loadingProfiles ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={`timeline-skeleton-${index}`} className="h-[460px] animate-pulse rounded-[32px] border border-white/5 bg-white/5" />
                ))
              ) : profiles.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-white/20 bg-white/5 p-10 text-center text-white/80">
                  <p className="text-lg font-semibold text-white">No timeline posts match these filters.</p>
                  <p className="mt-2 text-sm text-white/70">Reset search or keep scrolling for communities and events.</p>
                </div>
              ) : (
                profiles.map((profile, index) => {
                  const profileId = profile._id || profile.id || '';
                  return (
                    <TimelinePost
                      key={profileId || `member-${index}`}
                      profile={profile}
                      onPass={handlePass}
                      onLike={handleLike}
                      onChat={handleChat}
                      liking={profileId ? pendingLikes.has(profileId) : false}
                      liked={profileId ? likedIds.has(profileId) : false}
                    />
                  );
                })
              )}
            </div>

            {hasMore && !loadingProfiles ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadMoreProfiles}
                  disabled={loadingMoreProfiles}
                  className="rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loadingMoreProfiles ? 'Loading…' : 'Load more stories'}
                </button>
              </div>
            ) : null}
          </section>

          <section className="space-y-6 rounded-3xl bg-gradient-to-br from-[#0E1A2F] via-[#1F2A44] to-[#351647] p-8 text-white">
            <SectionHeader
              eyebrow="Circles"
              title="Communities to plug into"
              description="Each circle is curated around an intention — creative collabs, diaspora dinners, or wellness accountability partners."
            />
            {communityError && <p className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-[#F9B4C7]">{communityError}</p>}
            <div className="grid gap-6 lg:grid-cols-2">
              {loadingCommunities
                ? Array.from({ length: 4 }).map((_, index) => <div key={`community-skeleton-${index}`} className="h-72 rounded-3xl bg-white/5" />)
                : communities.slice(0, 4).map((community) => <CommunityCard key={community._id} community={community} />)}
            </div>
            {!loadingCommunities && communities.length === 0 && !communityError && (
              <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">No featured communities yet. Check back after more members join.</p>
            )}
          </section>

          <section className="space-y-6 rounded-3xl bg-[#080B14] p-8 text-white ring-1 ring-white/10">
            <SectionHeader
              eyebrow="Events"
              title="Gatherings & experiences"
              description="Host-led salons, pop-up dinners, and virtual mixers designed to keep the diaspora connected."
            />
            {eventError && <p className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-[#F9B4C7]">{eventError}</p>}
            <div className="grid gap-6 lg:grid-cols-3">
              {loadingEvents
                ? Array.from({ length: 3 }).map((_, index) => <div key={`event-skeleton-${index}`} className="h-96 rounded-3xl bg-white/5" />)
                : events.map((event) => <EventCard key={event._id} event={event} />)}
            </div>
            {!loadingEvents && events.length === 0 && !eventError && (
              <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">No upcoming events yet. Follow the newsletter for the next drop.</p>
            )}
          </section>
        </div>
      </section>
    </ProtectedRoute>
  );
}
