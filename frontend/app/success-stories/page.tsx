const loveLetters = [
  {
    couple: 'Maya & Kweku',
    city: 'Paris ↔ Accra',
    quote: 'We met inside the film club and ended up storyboarding a short together. Somewhere between the edits we fell in love.'
  },
  {
    couple: 'Zuri & Kamau',
    city: 'Nairobi',
    quote: 'Voice notes turned into daily sunrise check-ins. Our long-distance friendship became a covenant we both needed.'
  },
  {
    couple: 'Amara & Lindiwe',
    city: 'Johannesburg',
    quote: 'We matched through the wellness circle, hosted a retreat, and realized we make each other brave.'
  }
];

const friendshipWins = [
  {
    title: 'Accountability pods',
    detail: 'Writers and founders hopping on weekly calls to swap drafts and encouragement.'
  },
  {
    title: 'Heritage field trips',
    detail: 'Members planning museum crawls and ancestral archive visits together.'
  },
  {
    title: 'Diaspora care squads',
    detail: 'Rotating group chats that check in on relocations, visas, and Sunday scaries.'
  }
];

const stats = [
  { value: '3,200+', label: 'Love letters exchanged' },
  { value: '870', label: 'Couples celebrating milestones' },
  { value: '5,400+', label: 'Friendship matches' }
];

export default function SuccessStoriesPage() {
  return (
    <div className="bg-[#F7F4EF]">
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Success Stories</p>
        <h1 className="mt-4 font-display text-4xl text-[#2B1235] md:text-5xl">Love letters & friendships we cherish</h1>
        <p className="mt-4 text-lg text-[#2B1235]/80">
          AfroMatchmaker.com was built for soft places to land. Browse the journeys our members send in—slow burns, creative collaborators turned partners, and roommates who feel like cousins.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[28px] bg-white/70 p-6 text-center shadow-[0_20px_70px_rgba(42,11,47,0.12)]">
              <p className="font-display text-3xl text-[#C56693]">{stat.value}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#2B1235]/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
          {loveLetters.map((story) => (
            <article key={story.couple} className="flex flex-col rounded-[30px] bg-[#FFF6FA] p-6 shadow-[0_30px_90px_rgba(197,102,147,0.15)]">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Love Letter</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#2B1235]">{story.couple}</h2>
              <p className="text-sm text-[#2B1235]/70">{story.city}</p>
              <p className="mt-4 text-base text-[#2B1235]/80">“{story.quote}”</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#FCEEF4]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Friendship wins</p>
            <h3 className="mt-4 font-display text-3xl text-[#2B1235]">Beyond romance, our circles build family</h3>
            <p className="mt-3 text-base text-[#2B1235]/80">
              Members often tell us the platonic bonds feel just as magical as the dating wins. Circles morph into coworking crews, wellness squads, and travel companions with matching playlists.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-[#2B1235]/90">
              {friendshipWins.map((item) => (
                <li key={item.title} className="rounded-2xl bg-white/80 p-4 shadow-inner shadow-[#F4B3C5]/30">
                  <p className="font-semibold text-[#C56693]">{item.title}</p>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[32px] bg-gradient-to-br from-[#C56693]/20 via-[#F4B3C5]/20 to-white p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Share your story</p>
            <h4 className="mt-4 text-2xl font-semibold text-[#2B1235]">We celebrate every glow-up</h4>
            <p className="mt-3 text-base text-[#2B1235]/75">
              Email stories@afromatchmaker.com with candids, lessons, or a playlist that soundtracked your connection. Our studio team will follow up with a consent form and photographer perks.
            </p>
            <div className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(50,18,53,0.12)]">
              <p className="text-sm font-semibold text-[#2B1235]">Need a feature kit?</p>
              <p className="text-sm text-[#2B1235]/70">We provide prompts, interview outlines, and gifting codes so your story session feels effortless.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
