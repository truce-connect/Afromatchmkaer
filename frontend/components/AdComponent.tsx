"use client";

import { motion } from 'framer-motion';

interface AdComponentProps {
  title: string;
  description: string;
  ctaLabel: string;
  onClick?: () => void;
}

export function AdComponent({ title, description, ctaLabel, onClick }: AdComponentProps) {
  return (
    <motion.aside
      className="rounded-3xl border border-dashed border-[#C9A227]/40 bg-white p-6 shadow-card"
      whileHover={{ scale: 1.01 }}
    >
      <p className="text-xs uppercase tracking-[0.4em] text-[#C9A227]">Sponsored</p>
      <h3 className="mt-2 text-xl font-semibold text-[#2B2B2B]">{title}</h3>
      <p className="mt-2 text-sm text-[#2B2B2B]/70">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 rounded-full bg-[#C9A227] px-5 py-2 text-xs font-semibold text-white"
      >
        {ctaLabel}
      </button>
    </motion.aside>
  );
}
