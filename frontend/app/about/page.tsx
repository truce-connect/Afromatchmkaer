const values = [
  {
    title: 'Culture-first design',
    detail: 'Everything—copy, UX flows, photography—is grounded in the nuance of African and diasporan love languages.'
  },
  {
    title: 'Safety is softness',
    detail: 'Our team blends human moderation and product guardrails so members can relax and be vulnerable.'
  },
  {
    title: 'Shared leadership',
    detail: 'Hosts, artists, and wellness practitioners co-create the experience city by city.'
  }
];

const teamNotes = [
  {
    name: 'Lola Adebayo',
    role: 'Founder & Creative Director',
    note: 'Builds AfroMatchmaker.com as a digital village informed by her Nigerian-American upbringing and years in hospitality.'
  },
  {
    name: 'Kwame Mensah',
    role: 'Head of Community Trust',
    note: 'Architects our safety rituals, from profile verification to conflict mediation workshops.'
  },
  {
    name: 'Zinzi Mokoena',
    role: 'Experiences Lead',
    note: 'Designs dinner parties, heritage trips, and soul-care retreats with local collaborators.'
  }
];

export default function AboutPage() {
  return (
    <div className="bg-[#F7F4EF]">
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">About AfroMatchmaker.com</p>
        <h1 className="mt-4 font-display text-4xl text-[#2B1235] md:text-5xl">Our mission is to keep love close</h1>
        <p className="mt-4 text-lg text-[#2B1235]/80">
          AfroMatchmaker.com was born out of living between Lagos, Johannesburg, and the diaspora. We wanted a place where tenderness, accountability, and culture all coexist—online and IRL.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <article key={value.title} className="rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(42,11,47,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C56693]">Guiding principle</p>
              <h2 className="mt-3 text-xl font-semibold text-[#2B1235]">{value.title}</h2>
              <p className="mt-3 text-sm text-[#2B1235]/80">{value.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Meet the studio</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {teamNotes.map((member) => (
              <article key={member.name} className="rounded-[28px] bg-[#FFF6FA] p-6 shadow-[0_25px_80px_rgba(197,102,147,0.15)]">
                <h3 className="text-lg font-semibold text-[#2B1235]">{member.name}</h3>
                <p className="text-sm text-[#2B1235]/70">{member.role}</p>
                <p className="mt-3 text-sm text-[#2B1235]/85">{member.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FCEEF4]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Press & studio contact</p>
          <h2 className="mt-4 font-display text-3xl text-[#2B1235]">Need a quote or collaboration?</h2>
          <p className="mt-3 text-base text-[#2B1235]/80">
            Email press@afromatchmaker.com for media kits, interviews, or brand partnerships. For event collaborations, reach studio@afromatchmaker.com.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_70px_rgba(42,11,47,0.15)]">
              <p className="text-sm font-semibold text-[#2B1235]">Press & storytelling</p>
              <p className="text-sm text-[#2B1235]/70">Case studies, photography, and founder Q&As.</p>
            </div>
            <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_70px_rgba(42,11,47,0.15)]">
              <p className="text-sm font-semibold text-[#2B1235]">Partnerships & hosts</p>
              <p className="text-sm text-[#2B1235]/70">Venue takeovers, city pop-ups, and community drives.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
