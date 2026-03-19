interface ProfileCardProps {
  name: string;
  interests: string[];
  city: string;
}

export function ProfileCard({ name, interests, city }: ProfileCardProps) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <p className="text-sm text-[#2B2B2B]/60">{city}</p>
      <h3 className="mt-2 text-xl font-semibold text-[#2B2B2B]">{name}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {interests.map((interest) => (
          <span key={interest} className="rounded-full bg-[#F7F4EF] px-3 py-1 text-xs text-[#C65D3B]">
            {interest}
          </span>
        ))}
      </div>
    </div>
  );
}
