'use client';

import { CommunityRecord } from '@/lib/api';
import { CommunityCard } from './CommunityCard';

interface CommunityGridProps {
  communities: CommunityRecord[];
  onJoin?: (communityId: string) => void;
  joiningCommunityIds?: Set<string> | string[];
  emptyState?: React.ReactNode;
}

export function CommunityGrid({ communities, onJoin, joiningCommunityIds, emptyState }: CommunityGridProps) {
  const joiningSet = Array.isArray(joiningCommunityIds)
    ? new Set(joiningCommunityIds)
    : joiningCommunityIds || new Set<string>();

  if (!communities.length && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard
          key={community._id}
          community={community}
          onJoin={onJoin}
          joining={joiningSet.has(community._id)}
        />
      ))}
    </div>
  );
}
