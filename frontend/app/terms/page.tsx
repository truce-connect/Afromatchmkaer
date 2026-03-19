const principles = [
  {
    title: 'Community care',
    detail: 'We remove content or members who promote hate, harassment, or misinformation that puts the diaspora at risk.'
  },
  {
    title: 'Consent first',
    detail: 'Recorded calls, screenshots, or event footage can only be shared with permission from everyone featured.'
  },
  {
    title: 'Verified presence',
    detail: 'Each profile must represent a real person. Bots, fake names, or impersonations are grounds for suspension.'
  }
];

const membershipNotes = [
  'Members must be 18+ and comply with applicable local dating laws.',
  'Subscriptions auto-renew monthly; cancel anytime inside Settings → Billing.',
  'Paid members receive priority event invites and concierge support.',
  'We may update these terms to reflect new features or regulations. Major updates trigger an email notice.'
];

export default function TermsPage() {
  return (
    <div className="bg-[#F7F4EF]">
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Terms of Service</p>
        <h1 className="mt-4 font-display text-4xl text-[#2B1235] md:text-5xl">Policies that protect softness</h1>
        <p className="mt-4 text-lg text-[#2B1235]/80">
          AfroMatchmaker.com is a private membership community. These terms outline the expectations we hold so everyone feels safe and celebrated.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {principles.map((principle) => (
            <article key={principle.title} className="rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(42,11,47,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C56693]">{principle.title}</p>
              <p className="mt-3 text-sm text-[#2B1235]/80">{principle.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Membership commitments</p>
          <ul className="mt-6 space-y-4 text-sm text-[#2B1235]/80">
            {membershipNotes.map((note, index) => (
              <li key={index} className="rounded-[24px] bg-[#FFF6FA] p-6 shadow-[0_25px_80px_rgba(197,102,147,0.12)]">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#FCEEF4]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Contact</p>
          <p className="mt-4 text-base text-[#2B1235]/80">
            Questions about these terms? Email legal@afromatchmaker.com or write to our studio team. Include your profile email for faster support.
          </p>
        </div>
      </section>
    </div>
  );
}
