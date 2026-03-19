"use client";

import { motion } from 'framer-motion';

interface AdCardProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onClick?: () => void;
}

export function AdCard({
  title = 'Discover AfroMatchmaker Premium',
  description = 'Boost your visibility, unlock unlimited likes, and match faster with culture-led experiences curated for you.',
  ctaLabel = 'Upgrade today',
  onClick
}: AdCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative flex h-full flex-col justify-between rounded-3xl border border-dashed border-[#C9A227]/40 bg-[#FFFAEC] p-6 text-[#4B3A1E] shadow-card"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A227]">Sponsored</span>
      <div className="mt-4 space-y-3">
        <h3 className="text-2xl font-display text-[#2B2B2B]">{title}</h3>
        <p className="text-sm text-[#4B3A1E]/80">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-6 w-full rounded-full bg-[#C9A227] px-5 py-2 text-sm font-semibold text-white shadow-sm"
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}
