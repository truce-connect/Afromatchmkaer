'use client';

import Link from 'next/link';
import { CommunityRecord } from '@/lib/api';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1432839318976-b5c5785ce43f?auto=format&fit=crop&w=800&q=80&sat=-20&exp=-10';

interface CommunityCardProps {
  community: CommunityRecord;
  onJoin?: (communityId: string) => void;
  joining?: boolean;
}

export function CommunityCard({ community, onJoin, joining = false }: CommunityCardProps) {
  const { _id, coverImage, name, description, memberCount, interests = [], isMember } = community;
  const safeId = _id || community.slug || name;
  const canJoin = Boolean(onJoin) && !isMember;

  return (
    <article className="flex flex-col rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImage || FALLBACK_IMAGE} alt={`${name} community cover`} className="h-48 w-full object-cover" />
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3 text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Community</p>
          <h3 className="mt-2 font-display text-2xl">{name}</h3>
          <p className="mt-2 text-sm text-white/70 line-clamp-3">{description || 'Curated gathering space for the diaspora.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(interests.length ? interests : ['culture', 'wellness']).slice(0, 4).map((tag) => (
            <span
              key={`${safeId}-${tag}`}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>{memberCount ? `${memberCount} members` : 'New circle'}</span>
          {community.privacy === 'private' ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">Private</span> : null}
        </div>
        <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={() => (canJoin && onJoin ? onJoin(_id) : null)}
            disabled={!canJoin || joining}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#120217] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMember ? 'Member' : joining ? 'Joining…' : 'Join Community'}
          </button>
          <Link
            href={`/communities/${_id}`}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/80 hover:border-white/80"
          >
            View Community
          </Link>
        </div>
      </div>
    </article>
  );
}
