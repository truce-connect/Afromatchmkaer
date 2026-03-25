"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const heroStats = [
  { value: '20k+', label: 'Couples United' },
  { value: '98%', label: 'Match Success' },
  { value: '50+', label: 'Countries Connected' }
];

const heroImages = [
  '/heropic1.jpg',
  '/heropic2.jpg',
  '/heropic3.jpg'
];

export function HeroSection() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-[#FCEEF4]">
      <div className="absolute inset-0" aria-hidden>
        {heroImages.map((image, index) => (
          <motion.div
            key={image}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: activeImage === index ? 1 : 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#3E1655]/85 via-[#BE6A95]/70 to-[#F7C7D9]/90" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#FCEEF4]" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-28 pb-40 text-center text-white">
        <motion.p
          className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          AfroMatchmaker
        </motion.p>
        <motion.h1
          className="mt-4 font-display text-4xl leading-tight md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Where Hearts Find Home
        </motion.h1>
        <motion.p
          className="mt-4 max-w-3xl text-lg text-white/90"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Discover meaningful connections through shared culture, genuine romance, and spaces curated with warmth for the diaspora.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-col gap-4 md:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Link
            href="/join"
            className="rounded-full bg-white px-10 py-3 text-base font-semibold text-[#B55C8D] shadow-[0_20px_45px_rgba(27,9,33,0.4)] transition hover:-translate-y-0.5"
          >
            Start Your Journey
          </Link>
          <Link
            href="/success-stories"
            className="rounded-full border border-white/70 px-10 py-3 text-base font-semibold text-white hover:bg-white/10"
          >
            Explore Matches
          </Link>
        </motion.div>
      </div>

      <div className="relative mx-auto -mb-20 w-full max-w-5xl px-6">
        <motion.div
          className="grid gap-4 rounded-[32px] bg-white/95 p-8 text-left text-[#5C2A5F] shadow-[0_25px_90px_rgba(103,24,72,0.15)] md:grid-cols-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {heroStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-[#FDF4F8] px-6 py-5 text-center shadow-inner">
              <p className="font-display text-3xl text-[#B55C8D]">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold tracking-wide text-[#5C2A5F]/80">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
