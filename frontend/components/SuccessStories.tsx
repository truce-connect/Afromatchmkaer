"use client";

import { motion } from 'framer-motion';

const stories = [
  {
    name: 'Maya & Tunde',
    city: 'Accra ↔ Toronto',
    quote: 'We met inside the film club and now co-host screenings for the community.'
  },
  {
    name: 'Leila',
    city: 'Lisbon',
    quote: 'I moved to Europe without friends. AfroMatchmaker.com plugged me into creatives who feel like family.'
  },
  {
    name: 'Kwesi & Dee',
    city: 'Lagos',
    quote: 'From coffee chats to launching a wellness collective—the accountability was everything.'
  }
];

export function SuccessStories() {
  return (
    <section id="success-stories" className="bg-[#F7F4EF]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#C9A227]">Success Stories</p>
          <h2 className="mt-2 font-display text-3xl text-[#2B2B2B]">Friendships that evolve into movements</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((story) => (
            <motion.article key={story.name} className="rounded-3xl bg-white p-6 shadow-card" whileHover={{ translateY: -6 }}>
              <p className="text-sm text-[#2B2B2B]/70">{story.city}</p>
              <h3 className="mt-2 text-xl font-semibold text-[#2B2B2B]">{story.name}</h3>
              <p className="mt-3 text-sm text-[#2B2B2B]/80">“{story.quote}”</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
