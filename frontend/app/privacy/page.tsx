const dataPractices = [
  {
    title: 'Data we collect',
    detail: 'Profile basics, preferences, event RSVPs, and optional voice notes. Payment info is handled by PCI-compliant partners.'
  },
  {
    title: 'Why we collect it',
    detail: 'To personalize matchmaking, suggest circles, verify members, and produce safe gatherings.'
  },
  {
    title: 'How we protect it',
    detail: 'Encryption in transit and at rest, role-based access, and recurring audits with third-party security partners.'
  }
];

const memberControls = [
  'Download your data anytime inside Settings -> Privacy -> Export.',
  'Request deletion via privacy@afromatchmaker.com. We remove records from active systems within 30 days unless law requires retention.',
  'Update consent for marketing emails or SMS alerts inside Notification Preferences.',
  'Choose whether clips or photos you share at events can appear on our channels.'
];

export default function PrivacyPage() {
  return (
    <div className="bg-[#F7F4EF]">
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Privacy Policy</p>
        <h1 className="mt-4 font-display text-4xl text-[#2B1235] md:text-5xl">Your information stays sacred</h1>
        <p className="mt-4 text-lg text-[#2B1235]/80">
          AfroMatchmaker.com is intentional about how we gather, store, and use your data. Here is how we keep the community safe while honoring your boundaries.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {dataPractices.map((practice) => (
            <article key={practice.title} className="rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(42,11,47,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C56693]">{practice.title}</p>
              <p className="mt-3 text-sm text-[#2B1235]/80">{practice.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C56693]">Your controls</p>
          <ul className="mt-6 space-y-4 text-sm text-[#2B1235]/80">
            {memberControls.map((note, index) => (
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
            Questions about privacy? Email privacy@afromatchmaker.com or write to the studio team with your profile email for faster support.
          </p>
        </div>
      </section>
    </div>
  );
}
