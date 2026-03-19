"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

const navSections = [
  {
    title: 'Community',
    links: [
      { label: 'Gatherings & Events', href: '/events', blurb: 'Intimate salons, dinner parties, and curated meetups.' },
      { label: 'Success Stories', href: '/success-stories', blurb: 'Love letters and friendships that began on AfroMatchmaker.com.' },
      { label: 'Features', href: '/features', blurb: 'See how we design trust-first connections.' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about', blurb: 'Our mission, team, and cultural roots.' },
      { label: 'Press & Media', href: '/press', blurb: 'Story kits, brand assets, and founder notes.' },
      { label: 'Contact Studio', href: '/contact', blurb: 'Partnerships, speaking, or hosting inquiries.' }
    ]
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help', blurb: 'Guides, FAQs, and proactive safety tips.' },
      { label: 'Terms of Service', href: '/terms', blurb: 'How we steward data and community care.' },
      { label: 'Privacy Policy', href: '/privacy', blurb: 'Your information, transparently managed.' }
    ]
  }
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#4C1F4F] via-[#2B1432] to-[#140716] py-14 text-white">
      <div className="pointer-events-none absolute -top-10 right-10 h-48 w-48 rounded-full bg-[#C56693]/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-6 h-32 w-32 rounded-full bg-[#F4B3C5]/20 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl">AfroMatchmaker</p>
          <p className="mt-4 max-w-sm text-white/80">
            A cultural matchmaking home designed to keep diasporan hearts, friendships, and accountability circles beautifully connected.
          </p>
          <p className="mt-6 text-xs uppercase tracking-[0.4em] text-white/50">Navigation</p>
        </div>
        {navSections.map((section) => (
          <div key={section.title} className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">{section.title}</p>
            <div className="space-y-3">
              {section.links.map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ x: 4, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="rounded-3xl bg-white/5 p-4 backdrop-blur ring-1 ring-white/10"
                >
                  <Link href={link.href} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{link.label}</p>
                      <p className="text-xs text-white/70">{link.blurb}</p>
                    </div>
                    <motion.span
                      aria-hidden
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
                      whileHover={{ rotate: 8 }}
                    >
                      →
                    </motion.span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="relative mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-white/70 sm:flex-row">
        <p>© {new Date().getFullYear()} AfroMatchmaker. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="transition hover:text-white">Instagram</a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="transition hover:text-white">Twitter</a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="transition hover:text-white">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
