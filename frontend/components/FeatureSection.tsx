"use client";

import { motion } from 'framer-motion';

const features = [
  {
    title: 'Interest Circles',
    description: 'Join curated groups for travel buddies, wellness partners, and creative collaborators.',
    metric: '200+ circles'
  },
  {
    title: 'Conversation Starters',
    description: 'Smart prompts and audio rooms remove the awkwardness of first chats.',
    metric: '92% response rate'
  },
  {
    title: 'Community Events',
    description: 'City pop-ups and virtual salons hosted weekly across the diaspora.',
    metric: '35 cities'
  }
];

export function FeatureSection() {
  return (
    <section id="features" className="bg-[#F7F4EF]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">Features</p>
          <h2 className="mt-2 font-display text-3xl text-[#2B2B2B]">Everything you need to build real connections</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <motion.article
              key={feature.title}
              className="rounded-3xl bg-white p-6 shadow-card"
              whileHover={{ translateY: -6 }}
            >
              <p className="text-xs uppercase tracking-[0.4em] text-[#C9A227]">{feature.metric}</p>
              <h3 className="mt-3 text-xl font-semibold text-[#2B2B2B]">{feature.title}</h3>
              <p className="mt-2 text-sm text-[#2B2B2B]/70">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
