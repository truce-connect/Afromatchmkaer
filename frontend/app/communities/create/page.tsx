'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CreateCommunityModal } from '@/components/community/CreateCommunityModal';

export default function CreateCommunityPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <section className="min-h-screen bg-[#05020C] py-12 text-white">
        <div className="mx-auto max-w-4xl px-4">
          <CreateCommunityModal
            open
            mode="page"
            onClose={() => router.push('/communities')}
            onCreated={(community) => router.push(`/communities/${community._id}`)}
          />
        </div>
      </section>
    </ProtectedRoute>
  );
}
