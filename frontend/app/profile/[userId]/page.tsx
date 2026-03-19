"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import {
  discoverProfiles,
  fetchUserProfileById,
  reportUserProfile,
  sendFriendRequest,
  type DiscoverResponse,
  type UserProfile
} from '@/lib/api';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80';
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80';

export default function MemberProfilePage() {
  const params = useParams<{ userId: string }>();
  const rawUserId = params?.userId ?? '';
  const profileId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const isOwnProfile = useMemo(() => {
    if (!profileId) return false;
    const currentId = currentUser?._id || currentUser?.id;
    return Boolean(currentId && profileId === currentId);
  }, [currentUser?._id, currentUser?.id, profileId]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProfileById(profileId);
      setProfile(data);
    } catch (err) {
      console.error('Profile fetch failed', err);
      setError('Unable to load this profile. It may have been removed.');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const loadSuggestions = useCallback(
    async (seed?: UserProfile | null) => {
      if (!seed) return;
      setLoadingSuggestions(true);
      try {
        const params: Record<string, unknown> = { limit: 6 };
        if (seed.country) params.country = seed.country;
        if (seed.interests && seed.interests.length) {
          params.interests = seed.interests[0];
        }
        const response: DiscoverResponse = await discoverProfiles(params);
        const filtered = response.results.filter((item) => (item._id || item.id) !== profileId).slice(0, 6);
        setSuggestions(filtered);
      } catch (err) {
        console.error('Suggestion fetch failed', err);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [profileId]
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) {
      loadSuggestions(profile);
    }
  }, [profile, loadSuggestions]);

  useEffect(() => {
    if (isOwnProfile) {
      router.replace('/profile');
    }
  }, [isOwnProfile, router]);

  const handleFriendRequest = async () => {
    if (!profileId || isOwnProfile) return;
    setRequests('sending');
    try {
      await sendFriendRequest(profileId);
      setRequests('sent');
    } catch (err) {
      console.error('Friend request failed', err);
      setRequests('idle');
    }
  };

  const handleMessage = () => {
    if (!profileId) return;
    router.push(`/messages?chat=${profileId}`);
  };

  const handleReportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileId || !reportReason.trim()) return;
    setReportStatus('submitting');
    setReportMessage(null);
    try {
      await reportUserProfile({ targetUserId: profileId, reason: reportReason.trim(), details: reportDetails.trim() });
      setReportStatus('done');
      setReportMessage('Report submitted. Our safety team will review it shortly.');
      setReportReason('');
      setReportDetails('');
      setReportOpen(false);
    } catch (err) {
      console.error('Report failed', err);
      setReportStatus('idle');
      setReportMessage('Unable to submit the report. Please try again later.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <section className="bg-[#F7F4EF] py-16">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-card">
            <p className="font-semibold text-[#2B2B2B]">Loading profile…</p>
          </div>
        </section>
      </ProtectedRoute>
    );
  }

  if (error || !profileId) {
    return (
      <ProtectedRoute>
        <section className="bg-[#F7F4EF] py-16">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-card">
            <p className="font-semibold text-red-600">{error || 'Profile not found.'}</p>
            <Link href="/dashboard" className="mt-4 inline-block rounded-full bg-[#C65D3B] px-6 py-2 text-sm font-semibold text-white">
              Back to discover
            </Link>
          </div>
        </section>
      </ProtectedRoute>
    );
  }

  if (isOwnProfile) {
    return null;
  }

  const profileImage = profile?.profileImage || profile?.gallery?.[0] || FALLBACK_AVATAR;
  const coverImage = profile?.coverPhoto || FALLBACK_COVER;

  return (
    <ProtectedRoute>
      <section className="bg-gradient-to-b from-[#FFF1F5] via-[#FFF5F8] to-[#FDEEF4] py-10">
        <div className="mx-auto max-w-5xl space-y-8 px-4">
          <article className="overflow-hidden rounded-3xl bg-white shadow-card">
            <div className="relative h-56 w-full bg-[#F9CADA]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
            </div>
            <div className="px-8 pb-8">
              <div className="-mt-16 flex flex-wrap items-end gap-6">
                <div className="h-32 w-32 overflow-hidden rounded-3xl border-4 border-white bg-[#FDF2F8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profileImage} alt={profile?.name || 'Member avatar'} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <h1 className="font-display text-4xl text-[#2B2B2B]">{profile?.name}</h1>
                  <p className="text-sm text-[#8E4B5A]">
                    {profile?.country || 'Unknown location'} {profile?.address ? `· ${profile.address}` : ''}
                  </p>
                  {profile?.age && <p className="text-sm text-[#8E4B5A]">Age {profile.age}</p>}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleFriendRequest}
                    disabled={requests !== 'idle'}
                    className="rounded-full bg-[#C65D3B] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {requests === 'sent' ? 'Request sent' : requests === 'sending' ? 'Sending…' : 'Add Friend'}
                  </button>
                  <button
                    type="button"
                    onClick={handleMessage}
                    className="rounded-full border border-[#C65D3B] px-6 py-3 text-sm font-semibold text-[#C65D3B]"
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportOpen((prev) => !prev);
                      setReportMessage(null);
                    }}
                    className="rounded-full border border-[#8E4B5A]/40 px-6 py-3 text-sm font-semibold text-[#8E4B5A]"
                  >
                    Report
                  </button>
                </div>
              </div>
              {reportMessage && <p className="mt-4 text-sm text-[#C65D3B]">{reportMessage}</p>}
              {reportOpen && (
                <form onSubmit={handleReportSubmit} className="mt-4 space-y-3 rounded-2xl bg-[#FFF5F8] p-4">
                  <label className="text-sm text-[#2B2B2B]">
                    Reason
                    <input
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      required
                      className="mt-1 w-full rounded-2xl border border-[#F5D0E6] px-4 py-2 text-sm"
                      placeholder="Harassment, fake profile, spam, etc."
                    />
                  </label>
                  <label className="text-sm text-[#2B2B2B]">
                    Details (optional)
                    <textarea
                      value={reportDetails}
                      onChange={(event) => setReportDetails(event.target.value)}
                      className="mt-1 min-h-[80px] w-full rounded-2xl border border-[#F5D0E6] px-4 py-2 text-sm"
                      placeholder="Add helpful context"
                    />
                  </label>
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white">
                      {reportStatus === 'submitting' ? 'Submitting…' : 'Submit report'}
                    </button>
                    <button type="button" onClick={() => setReportOpen(false)} className="rounded-full border border-[#F5D0E6] px-5 py-2 text-sm font-semibold text-[#8E4B5A]">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </article>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="font-display text-2xl text-[#2B2B2B]">About</h2>
              <p className="mt-2 text-sm text-[#2B2B2B]">
                {profile?.bio || 'No bio shared yet. Send a friendly message to start the conversation!'}
              </p>
              <div className="mt-4 grid gap-4 text-sm text-[#2B2B2B]/80">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#8E4B5A]">Country</p>
                  <p>{profile?.country || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#8E4B5A]">City</p>
                  <p>{profile?.address || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#8E4B5A]">Diaspora</p>
                  <p>{profile?.diaspora ? 'Yes' : 'No / Not shared'}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="font-display text-2xl text-[#2B2B2B]">Interests</h2>
              {profile?.interests && profile.interests.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span key={interest} className="rounded-full bg-[#FDF2F8] px-3 py-1 text-xs font-semibold text-[#C65D3B]">
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#8E4B5A]">No interests listed yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8E4B5A]">Gallery</p>
                <h2 className="font-display text-2xl text-[#2B2B2B]">Snapshots of {profile?.name?.split(' ')[0] || 'their'} world</h2>
              </div>
            </div>
            {profile?.gallery && profile.gallery.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profile.gallery.map((url) => (
                  <div key={url} className="overflow-hidden rounded-2xl border border-[#F5D0E6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Gallery item" className="h-48 w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#8E4B5A]">No photos yet.</p>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8E4B5A]">Suggested connections</p>
                <h2 className="font-display text-2xl text-[#2B2B2B]">Friends sharing similar energy</h2>
              </div>
              <Link href="/dashboard" className="text-sm font-semibold text-[#C65D3B]">
                Explore more
              </Link>
            </div>
            {loadingSuggestions ? (
              <p className="mt-4 text-sm text-[#8E4B5A]">Loading suggestions…</p>
            ) : suggestions.length === 0 ? (
              <p className="mt-4 text-sm text-[#8E4B5A]">We will show suggestions soon.</p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {suggestions.map((suggestion) => {
                  const suggestionId = suggestion._id || suggestion.id || '';
                  const avatar = suggestion.profileImage || suggestion.gallery?.[0] || FALLBACK_AVATAR;
                  return (
                    <div key={suggestionId} className="flex flex-col rounded-2xl border border-[#F5D0E6] p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#FDF2F8]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatar} alt={suggestion.name || 'Member avatar'} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#2B2B2B]">{suggestion.name}</p>
                          <p className="text-xs text-[#8E4B5A]">{suggestion.country || 'Across Africa'}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-[#2B2B2B]/80">
                        {suggestion.bio ? `${suggestion.bio.slice(0, 80)}${suggestion.bio.length > 80 ? '…' : ''}` : 'Say hi and discover shared interests!'}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/profile/${suggestionId}`}
                          className="flex-1 rounded-full border border-[#F5D0E6] px-4 py-2 text-center text-sm font-semibold text-[#8E4B5A]"
                        >
                          View profile
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await sendFriendRequest(suggestionId);
                            } catch (err) {
                              console.error('Friend request failed', err);
                            }
                          }}
                          className="rounded-full bg-[#C65D3B] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Add Friend
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </ProtectedRoute>
  );
}
