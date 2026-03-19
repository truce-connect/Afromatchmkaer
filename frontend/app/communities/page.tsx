'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CommunityGrid } from '@/components/community/CommunityGrid';
import { CreateCommunityModal } from '@/components/community/CreateCommunityModal';
import { useAuth } from '@/hooks/useAuth';
import { CommunityRecord, fetchCommunities, joinCommunity } from '@/lib/api';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', interest: '' });
  const [inputs, setInputs] = useState({ search: '', interest: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [joiningIds, setJoiningIds] = useState<Set<string>>(new Set());

  const heroName = user?.name?.split(' ')[0] || 'Connector';
  const heroInterests = useMemo(() => user?.interests?.slice(0, 3) ?? [], [user?.interests]);

  const loadCommunities = useCallback(
    async (nextPage: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await fetchCommunities({
          page: nextPage,
          limit: 9,
          search: filters.search || undefined,
          interest: filters.interest || undefined
        });
        setCommunities((prev) => (append ? [...prev, ...response.results] : response.results));
        setHasNextPage(response.hasNextPage);
        setPage(nextPage);
      } catch (err) {
        console.error('Communities fetch failed', err);
        setError('Unable to load communities. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadCommunities(1, false);
  }, [filters, loadCommunities]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({ search: inputs.search.trim(), interest: inputs.interest.trim() });
  };

  const handleJoin = async (communityId: string) => {
    setJoiningIds((prev) => {
      const next = new Set(prev);
      next.add(communityId);
      return next;
    });
    try {
      const updated = await joinCommunity(communityId);
      setCommunities((prev) => prev.map((community) => (community._id === updated._id ? { ...community, ...updated } : community)));
    } catch (err) {
      console.error('Join community failed', err);
      setError('Unable to join that community right now.');
    } finally {
      setJoiningIds((prev) => {
        const next = new Set(prev);
        next.delete(communityId);
        return next;
      });
    }
  };

  const handleCommunityCreated = (community: CommunityRecord) => {
    setCommunities((prev) => [community, ...prev]);
    setModalOpen(false);
  };

  const emptyState = (
    <div className="col-span-full rounded-3xl bg-white/5 p-10 text-center text-white/70">
      <p className="text-lg font-semibold text-white">No circles found.</p>
      <p className="mt-2">Create a new community or adjust your filters.</p>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-4 rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#120217]"
      >
        Create a community
      </button>
    </div>
  );

  return (
    <ProtectedRoute>
      <section className="min-h-screen bg-gradient-to-b from-[#05020C] via-[#120317] to-[#240B2D] py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
          <header className="rounded-[40px] bg-gradient-to-br from-[#251438] via-[#33183E] to-[#4E1A40] p-10 shadow-[0_40px_140px_rgba(6,0,18,0.6)]">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">Communities</p>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              Curated circles for {heroName}
            </h1>
            <p className="mt-4 max-w-3xl text-base text-white/80">
              Plug into supper clubs, accountability pods, and builder cohorts led by the diaspora. Tailored suggestions come from your interests and the vibe you set across AfroMatchmaker.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
              {heroInterests.length ? (
                <span className="rounded-full bg-white/10 px-4 py-2">Tuned to {heroInterests.join(' • ')}</span>
              ) : (
                <span className="rounded-full bg-white/10 px-4 py-2">Update your profile interests to sharpen recommendations</span>
              )}
              <span className="rounded-full bg-white/10 px-4 py-2">{communities.length || 'Fresh'} matches</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#120217] transition hover:-translate-y-0.5"
              >
                Create community
              </button>
              <Link
                href="/communities/create"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/80"
              >
                Advanced builder
              </Link>
            </div>
          </header>

          <section className="space-y-6 rounded-[32px] bg-white/5 p-6 ring-1 ring-white/10">
            <form onSubmit={handleSearchSubmit} className="grid gap-4 rounded-2xl bg-white/5 p-4 md:grid-cols-[1.5fr,1fr,auto]">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Search
                <input
                  value={inputs.search}
                  onChange={(event) => setInputs((prev) => ({ ...prev, search: event.target.value }))}
                  placeholder="Name or description"
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Interest
                <input
                  value={inputs.interest}
                  onChange={(event) => setInputs((prev) => ({ ...prev, interest: event.target.value }))}
                  placeholder="wellness, tech, food"
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                />
              </label>
              <div className="flex items-end">
                <button type="submit" className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#120217]">
                  Search
                </button>
              </div>
            </form>

            {error ? (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`community-skeleton-${index}`} className="h-80 rounded-3xl bg-white/5" />
                ))}
              </div>
            ) : (
              <CommunityGrid
                communities={communities}
                onJoin={handleJoin}
                joiningCommunityIds={joiningIds}
                emptyState={emptyState}
              />
            )}

            {hasNextPage ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => loadCommunities(page + 1, true)}
                  disabled={loadingMore}
                  className="rounded-full border border-white/40 px-8 py-2 text-sm font-semibold text-white/80 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Load more communities'}
                </button>
              </div>
            ) : null}
          </section>
        </div>
        <CreateCommunityModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCommunityCreated} />
      </section>
    </ProtectedRoute>
  );
}
