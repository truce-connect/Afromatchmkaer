'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import {
  CommunityRecord,
  fetchCommunityById,
  fetchFriendSuggestions,
  inviteCommunityMember,
  joinCommunity,
  type UserProfile
} from '@/lib/api';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1600&q=80&sat=-20&exp=-10';

export default function CommunityDetailsPage() {
  const params = useParams<{ communityId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [community, setCommunity] = useState<CommunityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [suggestedMembers, setSuggestedMembers] = useState<UserProfile[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const communityId = params?.communityId || '';

  const loadCommunity = useCallback(async () => {
    if (!communityId) {
      setError('Community not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommunityById(communityId);
      setCommunity(data);
    } catch (err) {
      console.error('Community fetch failed', err);
      setError('Unable to load this community.');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const isAdmin = useMemo(() => {
    if (!community || !user) return false;
    const createdBy = community.createdBy;
    if (!createdBy) return false;
    if (typeof createdBy === 'string') {
      return createdBy === (user._id || user.id);
    }
    return createdBy._id === (user._id || user.id);
  }, [community, user]);

  const isMember = community?.isMember || Boolean(community?.members?.some((member) => member._id === (user?._id || user?.id)));

  const loadSuggestions = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingSuggestions(true);
    try {
      const data = await fetchFriendSuggestions({ limit: 6 });
      setSuggestedMembers(data);
    } catch (err) {
      console.error('Suggestion fetch failed', err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleJoin = async () => {
    if (!communityId) return;
    setJoining(true);
    setInviteMessage(null);
    try {
      await joinCommunity(communityId);
      await loadCommunity();
    } catch (err) {
      console.error('Join community failed', err);
      setInviteMessage('Unable to join this community right now.');
    } finally {
      setJoining(false);
    }
  };

  const handleInvite = async (member: UserProfile) => {
    if (!communityId || !member?._id) return;
    setInvitingUserId(member._id);
    setInviteMessage(null);
    try {
      await inviteCommunityMember(communityId, member._id);
      setInviteMessage(`Invited ${member.name || 'member'} to the community.`);
      await loadCommunity();
    } catch (err) {
      console.error('Invite failed', err);
      setInviteMessage('Unable to invite that member.');
    } finally {
      setInvitingUserId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <section className="min-h-screen bg-[#05020C] py-12 text-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="h-64 animate-pulse rounded-[40px] bg-white/5" />
          </div>
        </section>
      </ProtectedRoute>
    );
  }

  if (error || !community) {
    return (
      <ProtectedRoute>
        <section className="min-h-screen bg-[#05020C] py-12 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="text-lg font-semibold">{error || 'Community not available.'}</p>
            <button
              type="button"
              onClick={() => router.push('/communities')}
              className="mt-4 rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217]"
            >
              Back to communities
            </button>
          </div>
        </section>
      </ProtectedRoute>
    );
  }

  const coverImage = community.coverImage || FALLBACK_IMAGE;
  const creatorName = typeof community.createdBy === 'string' ? undefined : community.createdBy?.name;

  return (
    <ProtectedRoute>
      <section className="min-h-screen bg-[#05020C] py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-[40px] bg-white/5 ring-1 ring-white/10">
            <div className="relative h-64 w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-[#05020C] via-black/20 to-transparent" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt={`${community.name} cover`} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-6 p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Community</p>
                  <h1 className="mt-2 font-display text-4xl">{community.name}</h1>
                  <p className="mt-3 max-w-3xl text-sm text-white/70">{community.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
                    {community.memberCount || community.members?.length || 0} members
                  </span>
                  {creatorName ? <span className="text-sm text-white/60">Hosted by {creatorName}</span> : null}
                  {!isMember ? (
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joining}
                      className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217] disabled:opacity-60"
                    >
                      {joining ? 'Joining…' : 'Join community'}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(community.interests && community.interests.length ? community.interests : ['community']).map((interest) => (
                  <span key={interest} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {inviteMessage ? (
            <div className="mt-6 rounded-3xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80">{inviteMessage}</div>
          ) : null}

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr,1fr]">
            <section className="rounded-[32px] bg-white/5 p-6 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Members</p>
                  <h2 className="mt-2 font-display text-3xl">{community.members?.length || community.memberCount || 0} in this circle</h2>
                </div>
                <Link href="/communities" className="text-sm text-white/60 underline">
                  Find more circles
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {(community.members || []).map((member) => (
                  <div key={member._id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={member.profileImage || FALLBACK_IMAGE}
                          alt={member.name || 'Member avatar'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{member.name || 'Community member'}</p>
                        <p className="text-xs text-white/50">{member.country || 'Global'}</p>
                      </div>
                    </div>
                    {member.interests?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                        {member.interests.slice(0, 3).map((interest) => (
                          <span key={`${member._id}-${interest}`} className="rounded-full bg-white/10 px-2 py-0.5">
                            #{interest}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!community.members?.length && (
                  <div className="col-span-full rounded-3xl bg-white/5 p-6 text-center text-white/70">
                    No members yet. Be the first to join!
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6 rounded-[32px] bg-white/5 p-6 ring-1 ring-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Admin tools</p>
                <h3 className="mt-2 font-display text-2xl">Invite members</h3>
                <p className="mt-2 text-sm text-white/70">Bring in friends who match the vibe. Suggestions update from your global network.</p>
              </div>
              {isAdmin ? (
                <div className="space-y-3">
                  {loadingSuggestions ? (
                    <p className="text-sm text-white/60">Loading suggestions…</p>
                  ) : (
                    suggestedMembers.map((member) => (
                      <div key={member._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-xs text-white/60">{member.interests?.slice(0, 2).join(' • ') || 'Multi-passionate'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInvite(member)}
                          disabled={invitingUserId === member._id}
                          className="rounded-full bg-white px-4 py-1 text-xs font-semibold text-[#120217] disabled:opacity-60"
                        >
                          {invitingUserId === member._id ? 'Inviting…' : 'Invite'}
                        </button>
                      </div>
                    ))
                  )}
                  {!suggestedMembers.length && !loadingSuggestions ? (
                    <p className="text-sm text-white/60">No suggestions yet. Grow your matches to unlock invites.</p>
                  ) : null}
                </div>
              ) : (
                <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/60">Only admins can invite new members.</p>
              )}
              <Link
                href="/communities"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/80"
              >
                Back to communities
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </ProtectedRoute>
  );
}
