import Link from 'next/link';
import { FeatureSection } from '@/components/FeatureSection';
import { AdComponent } from '@/components/AdComponent';

const communityStats = [
  { value: '120k+', label: 'AfroMatchmaker.com profiles' },
  { value: '4k+', label: 'City & interest circles' },
  { value: '580+', label: 'IRL experiences hosted' }
];

const platformPillars = [
  {
    title: 'Culture-first social graph',
    body: 'AfroMatchmaker.com links friends-of-friends, alumni, and diaspora circles inside a curated network with safety tools and shared values at the center.'
  },
  {
    title: 'Profiles with real context',
    body: 'Voice notes, vibe cards, and intentional prompts let members show personality so introductions feel familiar before the first chat.'
  },
  {
    title: 'Circles & clubs everywhere',
    body: 'Host or join accountability pods, hobby squads, and city brunch crews. Every circle has its own feed, calendar, and concierge support.'
  }
];

const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    caption: 'Community brunch in Accra'
  },
  {
    src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    caption: 'Sunset conversations in Dakar'
  },
  {
    src: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    caption: 'Creative studio sessions in Nairobi'
  }
];

export default function FeaturesPage() {
  return (
    <>
      <FeaturesHero />
      <PlatformDetails />
      <FeatureGallery />
      <FeatureSection />
      <CommunitySpotlight />
    </>
  );
}

function FeaturesHero() {
  return (
    <section className="bg-[#FCEEF4] py-24">
      <div className="mx-auto max-w-5xl px-6 text-center md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Why AfroMatchmaker.com</p>
        <h1 className="mt-4 font-display text-4xl text-[#5C2A5F] md:text-5xl">A social matching home for the diaspora</h1>
        <p className="mt-4 text-lg text-[#5C2A5F]/80">
          AfroMatchmaker.com blends the warmth of a private social network with curated romance journeys. Every feature is designed to help Africans and the diaspora stay linked—whether you are
          meeting a partner, finding accountability buddies, or rebuilding a community after moving cities.
        </p>
        <div className="mt-8 flex flex-col gap-4 md:flex-row">
          <Link href="/join" className="rounded-full bg-[#C56693] px-8 py-3 text-center text-white shadow-lg shadow-[#C56693]/40">
            Join AfroMatchmaker.com
          </Link>
          <Link href="/success-stories" className="rounded-full border border-[#C56693] px-8 py-3 text-center text-[#C56693]">
            See Love Stories
          </Link>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {communityStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl bg-white p-6 text-center shadow-[0_20px_70px_rgba(197,102,147,0.15)]">
              <p className="font-display text-3xl text-[#C56693]">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#5C2A5F]/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformDetails() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">What the platform does</p>
          <h2 className="mt-4 font-display text-4xl text-[#5C2A5F]">AfroMatchmaker.com keeps every circle connected</h2>
          <p className="mt-3 text-lg text-[#5C2A5F]/80">
            Think timelines, groups, and events—but tailor-made for Africans worldwide. Instead of generic feeds, we map trust networks so you can share updates, plan hangouts, and discover
            intentional matches without noise.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {platformPillars.map((pillar) => (
            <article key={pillar.title} className="rounded-[28px] bg-[#FFF6FA] p-6 shadow-[0_20px_70px_rgba(205,140,170,0.15)] ring-1 ring-[#F7D7E7]">
              <h3 className="text-xl font-semibold text-[#5C2A5F]">{pillar.title}</h3>
              <p className="mt-3 text-sm text-[#5C2A5F]/80">{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGallery() {
  const [primary, ...secondary] = galleryImages;

  if (!primary) {
    return null;
  }

  return (
    <section className="bg-[#FFF6FA] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Scenes from the platform</p>
          <h2 className="mt-4 font-display text-4xl text-[#5C2A5F]">Beautiful moments powered by AfroMatchmaker.com</h2>
          <p className="mt-3 text-base text-[#5C2A5F]/80">City dinners, creative collabs, and quiet accountability sessions—all captured by hosts across the diaspora.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <figure className="relative overflow-hidden rounded-[36px] shadow-[0_25px_90px_rgba(197,102,147,0.25)]">
            <img src={primary.src} alt={primary.caption} className="h-full w-full object-cover" loading="lazy" />
            <figcaption className="absolute bottom-4 left-4 rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-[#5C2A5F]">{primary.caption}</figcaption>
          </figure>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {secondary.map((image) => (
              <figure key={image.caption} className="relative overflow-hidden rounded-[28px] shadow-[0_20px_70px_rgba(197,102,147,0.2)]">
                <img src={image.src} alt={image.caption} className="h-full w-full object-cover" loading="lazy" />
                <figcaption className="absolute inset-x-4 bottom-4 rounded-full bg-white/85 px-4 py-1 text-sm font-semibold text-[#5C2A5F] text-center">{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunitySpotlight() {
  return (
    <section className="bg-[#F7F4EF] py-20">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[32px] bg-white p-8 shadow-[0_25px_80px_rgba(197,102,147,0.2)]">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Digital village</p>
          <h3 className="mt-4 font-display text-3xl text-[#5C2A5F]">Our own digital village</h3>
          <p className="mt-3 text-base text-[#5C2A5F]/80">
            AfroMatchmaker.com members create city boards, post wins, and drop questions inside moderated feeds. Every circle has media sharing, live rooms, and event RSVPs so you can move from
            chat threads to IRL hugs quickly.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-[#5C2A5F]">
            <li>• Share story updates, playlists, and livestreams with people who already understand your background.</li>
            <li>• Build affinity clubs—faith fellowships, tech founders, wellness collectives—and keep everyone synced.</li>
            <li>• Tap concierge hosts to co-create curated meetups with on-the-ground support, so gatherings feel effortless.</li>
          </ul>
        </div>
        <AdComponent
          title="AfroMatchmaker.com City Hosts"
          description="Apply to steward local dinner parties, digital salons, and community drives that keep our graph vibrant."
          ctaLabel="Become a host"
        />
      </div>
    </section>
  );
}
