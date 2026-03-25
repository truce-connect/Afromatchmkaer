import { HeroSection } from '@/components/HeroSection';

type IconType = 'heart' | 'globe' | 'shield' | 'spark';

const experienceHighlights: { title: string; description: string; icon: IconType }[] = [
  {
    title: 'Romance-Focused Matching',
    description: 'Intentional compatibility journeys help you meet someone who resonates with your heart and culture.',
    icon: 'heart'
  },
  {
    title: 'Cultural Chemistry',
    description: 'Connect with people who celebrate your heritage, values, and soulful approach to love.',
    icon: 'globe'
  },
  {
    title: 'Safe & Intimate Space',
    description: 'A verified haven where genuine conversations and heartfelt bonds can flourish naturally.',
    icon: 'shield'
  },
  {
    title: 'Romantic Events',
    description: 'Curated meetups and intimate gatherings designed for meaningful in-person moments.',
    icon: 'spark'
  }
];

const loveLetters = [
  {
    couple: 'Amara & Kofi',
    location: 'Accra, Ghana',
    quote:
      'Our connection was instant and profound. AfroMatchmaker helped us find not just love, but our soulmate. Every moment together feels like a dream.',
    image: 'https://images.unsplash.com/photo-1617197617183-b67f42671b83?auto=format&fit=crop&w=600&q=80'
  },
  {
    couple: 'Zara & Emeka',
    location: 'Lagos, Nigeria',
    quote:
      'We bonded over our shared heritage and romantic dreams. Now we are planning our wedding and could not be happier. This platform changed our lives.',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80'
  },
  {
    couple: 'Aisha & Kwame',
    location: 'London, UK',
    quote:
      'Finding someone who understands both my culture and my heart was a dream come true. The romantic journey we have shared has been magical.',
    image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=600&q=80'
  }
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ExperienceSection />
      <LoveLettersSection />
    </>
  );
}

function ExperienceSection() {
  return (
    <section className="bg-[#FCEEF4] pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C56693]">Fall in Love with the Experience</p>
        <h2 className="mt-4 font-display text-4xl text-[#5C2A5F]">Creating magical moments through shared culture</h2>
        <p className="mt-3 text-lg text-[#5C2A5F]/80">
          Where hearts connect authentically through heritage, intentional romance, and soulful gatherings.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-4">
        {experienceHighlights.map((highlight) => (
          <article
            key={highlight.title}
            className="rounded-[28px] bg-white p-6 text-left shadow-[0_25px_80px_rgba(205,140,170,0.2)] ring-1 ring-[#F7D7E7]/70"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBE5EF] text-[#C34F7A]">
              <IconBadge type={highlight.icon} />
            </span>
            <h3 className="mt-6 text-xl font-semibold text-[#5C2A5F]">{highlight.title}</h3>
            <p className="mt-3 text-base text-[#5C2A5F]/80">{highlight.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LoveLettersSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C56693]">Love Letters</p>
          <h2 className="mt-4 font-display text-4xl text-[#5C2A5F]">Real Romance, Real Stories</h2>
          <p className="mt-3 text-lg text-[#5C2A5F]/80">Authentic couples across the diaspora sharing the love they discovered here.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {loveLetters.map((story) => (
            <article
              key={story.couple}
              className="flex h-full flex-col overflow-hidden rounded-[30px] bg-[#FFF6FA] shadow-[0_30px_90px_rgba(205,140,170,0.15)] ring-1 ring-[#F7D7E7]"
            >
              <div className="relative h-72 w-full">
                <img
                  src={story.image}
                  alt={`${story.couple} celebrating love`}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col gap-5 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#FDE2EE] to-[#D37EA4] ring-4 ring-white/70" aria-hidden />
                  <div>
                    <p className="text-lg font-semibold text-[#5C2A5F]">{story.couple}</p>
                    <p className="text-sm text-[#5C2A5F]/70">{story.location}</p>
                  </div>
                </div>
                <p className="flex-1 text-base text-[#5C2A5F]/80">&ldquo;{story.quote}&rdquo;</p>
                <div className="flex gap-1 text-[#F4B3C5]" aria-label="5 star review">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index}>★</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconBadge({ type }: { type: IconType }) {
  switch (type) {
    case 'heart':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 20.5l-1.3-1.17C6 15 3 12.25 3 8.7 3 6 5 4 7.5 4c1.7 0 3.3 1 4.5 2.3C13.2 5 14.8 4 16.5 4 19 4 21 6 21 8.7c0 3.55-3 6.3-7.7 10.63z"
            fill="#C74C75"
          />
        </svg>
      );
    case 'globe':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="#B15B85" strokeWidth="1.6" />
          <path d="M3 12h18" stroke="#B15B85" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M12 3c2.5 3 2.5 15 0 18m-2.5-17.2c-2 3-2 14.4 0 17.4" stroke="#B15B85" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'shield':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21c-4.8-2.2-7-4.4-7-9V6l7-3 7 3v6c0 4.6-2.2 6.8-7 9z"
            stroke="#B15B85"
            strokeWidth="1.5"
            fill="rgba(209,139,173,0.2)"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"
            fill="#B15B85"
            stroke="#B15B85"
            strokeWidth="0.8"
          />
        </svg>
      );
    default:
      return null;
  }
}
