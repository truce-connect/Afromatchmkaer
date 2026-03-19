'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DiscoverProfileCard } from '@/components/DiscoverProfileCard';
import { useAuth } from '@/hooks/useAuth';
import { fetchMatchRecommendations, sendFriendRequest, type UserProfile } from '@/lib/api';

type BannerState = { type: 'success' | 'error'; text: string } | null;

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState>(null);
  const [requesting, setRequesting] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const loadMatches = useCallback(async () => {
    setError(null);
    setBanner(null);
    setLoading(true);
    try {
      const data = await fetchMatchRecommendations();
      setMatches(data);
    } catch (err) {
      console.error('Match recommendations failed', err);
      setError('We could not fetch your matches. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleSkip = useCallback((profileId: string) => {
    if (!profileId) return;
    setMatches((prev) => prev.filter((profile) => (profile._id || profile.id) !== profileId));
  }, []);

  const handleConnect = useCallback(
    async (profileId: string) => {
      if (!profileId || requesting.has(profileId) || requested.has(profileId)) {
        return;
      }
      setBanner(null);
      setRequesting((prev) => {
        const next = new Set(prev);
        next.add(profileId);
        return next;
      });
      try {
        await sendFriendRequest(profileId);
        setRequested((prev) => {
          const next = new Set(prev);
          next.add(profileId);
          return next;
        });
        setBanner({ type: 'success', text: 'Intro request sent. We will notify you once they respond.' });
      } catch (err) {
        console.error('Friend request failed', err);
        setBanner({ type: 'error', text: 'Could not send that request. Please retry.' });
      } finally {
        setRequesting((prev) => {
          const next = new Set(prev);
          next.delete(profileId);
          return next;
        });
      }
    },
    [requested, requesting]
  );

  const heroName = useMemo(() => user?.name?.split(' ')[0] || 'Connector', [user?.name]);
  const heroInterests = useMemo(() => user?.interests?.slice(0, 3) ?? [], [user?.interests]);
  const interestCopy = heroInterests.length ? heroInterests.join(' • ') : 'culture, travel, and impact';
  const matchCount = matches.filter((profile) => profile._id || profile.id).length;

  return (
    <ProtectedRoute>
      <section className="min-h-screen bg-[#05020C] py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <header className="rounded-[40px] bg-gradient-to-br from-[#1B0B2A] via-[#3B1244] to-[#5A1751] p-10 shadow-[0_40px_140px_rgba(6,0,18,0.6)]">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">Matches</p>
            <h1 className="mt-6 font-display text-4xl leading-tight md:text-5xl">Handpicked intros for {heroName}</h1>
            <p className="mt-4 max-w-3xl text-base text-white/80">
              These members share overlapping interests, nearby home bases, or similar flows with you. Send an intro request to open a private chat.
              Need a wider search? The public Discover feed is always open regardless of filters.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="rounded-full bg-white/10 px-4 py-2">Tuned to {interestCopy}</span>
              <span className="rounded-full bg-white/10 px-4 py-2">{matchCount ? `${matchCount} suggestions` : 'Sourcing matches…'}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={loadMatches}
                className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217] transition hover:-translate-y-0.5"
              >
                Refresh matches
              </button>
              <Link href="/discover" className="rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white/80">
                Go to Discover
              </Link>
            </div>
          </header>

          <section className="mt-10 rounded-[32px] bg-white/5 p-8 backdrop-blur ring-1 ring-white/10">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl">Suggested people</h2>
              <p className="text-sm text-white/70">
                Matches refresh every few minutes based on your interests, country, and age preferences. Skip profiles to fine-tune the feed.
              </p>
            </div>

            {banner ? (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  banner.type === 'success'
                    ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100'
                    : 'border-rose-400/50 bg-rose-400/10 text-rose-100'
                }`}
              >
                {banner.text}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-3xl bg-[#2B0D1F] px-6 py-5 text-sm text-[#F7B5CC]">
                {error}
                <button type="button" onClick={loadMatches} className="ml-3 underline">
                  Try again
                </button>
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={`match-skeleton-${index}`} className="h-80 rounded-3xl bg-white/10" />
                  ))
                : matchCount === 0
                ? (
                    <div className="col-span-full rounded-3xl bg-[#0D0F1A] p-10 text-center">
                      <p className="text-lg font-semibold">We need a little more data to match you.</p>
                      <p className="mt-2 text-sm text-white/70">Update your interests or explore the Discover feed to seed the algorithm.</p>
                      <div className="mt-4 flex justify-center gap-3">
                        <Link href="/profile" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#120217]">
                          Edit profile
                        </Link>
                        <Link href="/discover" className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white/80">
                          Browse Discover
                        </Link>
                      </div>
                    </div>
                  )
                : matches.map((profile) => {
                    const profileId = profile._id || profile.id;
                    if (!profileId) {
                      return null;
                    }
                    return (
                      <DiscoverProfileCard
                        key={profileId}
                        profile={profile}
                        onPass={handleSkip}
                        onLike={handleConnect}
                        liked={requested.has(profileId)}
                        liking={requesting.has(profileId)}
                        primaryLabel="Request intro"
                        primaryDisabledLabel="Requested"
                        secondaryLabel="Skip"
                      />
                    );
                  })}
            </div>
          </section>
        </div>
      </section>
    </ProtectedRoute>
  );
}
