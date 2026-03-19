"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/lib/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80';

interface DiscoverProfileCardProps {
  profile: UserProfile;
  onLike: (profileId: string) => void;
  onPass: (profileId: string) => void;
  liked?: boolean;
  liking?: boolean;
  primaryLabel?: string;
  primaryDisabledLabel?: string;
  secondaryLabel?: string;
}

export function DiscoverProfileCard({
  profile,
  onLike,
  onPass,
  liked = false,
  liking = false,
  primaryLabel = 'Like',
  primaryDisabledLabel = 'Requested',
  secondaryLabel = 'Pass'
}: DiscoverProfileCardProps) {
  const profileId = profile._id || profile.id || '';
  const displayImage = profile.profileImage || profile.gallery?.[0] || FALLBACK_IMAGE;
  const interestChips = (profile.interests || []).slice(0, 4);
  const bioPreview = profile.bio ? `${profile.bio.slice(0, 120)}${profile.bio.length > 120 ? '…' : ''}` : 'No bio yet, but ready to explore new connections.';

  return (
    <motion.div whileHover={{ y: -6 }} className="flex h-full flex-col rounded-3xl border border-[#F5D0E6] bg-white shadow-card">
      <div className="relative overflow-hidden rounded-t-3xl bg-[#FCEFFC]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayImage} alt={profile.name || 'Member profile'} className="h-64 w-full object-cover" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold">{profile.name || 'Community member'}</h3>
            {profile.age && <span className="text-sm font-medium text-white/80">· {profile.age}</span>}
          </div>
          <p className="text-sm text-white/80">{profile.country || 'Across Africa'}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm text-[#2B2B2B]/80">{bioPreview}</p>
        {interestChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {interestChips.map((interest) => (
              <span key={interest} className="rounded-full bg-[#FDF2F8] px-3 py-1 text-xs font-semibold text-[#C65D3B]">
                {interest}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => (profileId ? onPass(profileId) : undefined)}
            className="flex-1 rounded-full border border-[#F5D0E6] px-4 py-2 text-sm font-semibold text-[#8E4B5A] transition hover:bg-[#FFF5F8]"
          >
            {secondaryLabel}
          </button>
          <button
            type="button"
            disabled={!profileId || liking || liked}
            onClick={() => (profileId ? onLike(profileId) : undefined)}
            className="flex-1 rounded-full bg-[#C65D3B] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {liking ? 'Sending…' : liked ? primaryDisabledLabel : primaryLabel}
          </button>
        </div>
        <Link href={`/profile/${profileId}`} className="text-center text-sm font-semibold text-[#C65D3B]">
          View full profile
        </Link>
      </div>
    </motion.div>
  );
}
