const faqs = [
  {
    question: 'How do I verify my profile?',
    answer: 'Upload a short selfie video during onboarding and our trust team reviews it within 24 hours. You will receive a badge once approved.'
  },
  {
    question: 'What happens if I need to report someone?',
    answer: 'Use the in-app report button or email trust@afromatchmaker.com with screenshots. Hosts and moderators respond within one business day.'
  },
  {
    question: 'Can I pause or delete my account?',
    answer: 'Yes. Navigate to Settings → Membership → Pause. To delete, submit a request and we process it within 7 days.'
  }
];

const supportChannels = [
  {
    title: 'Safety & trust',
    contact: 'trust@afromatchmaker.com',
    description: 'Background checks, conflict mediation, and urgent concerns.'
  },
  {
    title: 'Events & hosting',
    contact: 'studio@afromatchmaker.com',
    description: 'Venue ideas, co-hosting, and production logistics.'
  },
  {
    title: 'Product feedback',
    contact: 'hello@afromatchmaker.com',
    description: 'Feature requests, bugs, and community suggestions.'
  }
];

export default function HelpPage() {
  return (
    <div className="bg-[#F7F4EF]">
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Help Center</p>
        <h1 className="mt-4 font-display text-4xl text-[#2B1235] md:text-5xl">Answers for every milestone</h1>
        <p className="mt-4 text-lg text-[#2B1235]/80">
          We bake care into each step—matchmaking, friendship circles, and events. Browse FAQs or reach our team directly.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {supportChannels.map((channel) => (
            <article key={channel.title} className="rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(42,11,47,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C56693]">{channel.title}</p>
              <p className="mt-3 text-sm text-[#2B1235]/80">{channel.description}</p>
              <a className="mt-4 inline-flex text-sm font-semibold text-[#C56693]" href={`mailto:${channel.contact}`}>
                {channel.contact}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">FAQs</p>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-[24px] bg-[#FFF6FA] p-6 shadow-[0_25px_80px_rgba(197,102,147,0.12)]">
                <summary className="cursor-pointer text-lg font-semibold text-[#2B1235]">{faq.question}</summary>
                <p className="mt-3 text-sm text-[#2B1235]/80">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
