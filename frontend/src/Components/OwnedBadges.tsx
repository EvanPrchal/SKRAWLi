type BadgeDefinition = {
  code: string;
  name: string;
  description: string | null;
};

type OwnedBadgesProps = {
  allBadges: BadgeDefinition[];
  ownedCodes: string[];
};
const OwnedBadges = ({ allBadges, ownedCodes }: OwnedBadgesProps) => {
  if (!allBadges.length) {
    return <div className="text-body font-body text-skrawl-purple">No badges configured yet.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
      {allBadges.map((badge) => {
        const unlocked = ownedCodes.includes(badge.code);
        return (
          <div
            key={badge.code}
            className={`rounded-lg border p-4 flex flex-row items-center gap-3 transition ${
              unlocked ? "border-skrawl-cyan bg-skrawl-cyan/10" : "border-gray-300 bg-white/40"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
                unlocked ? "border-skrawl-purple bg-skrawl-purple/20" : "border-gray-400 bg-gray-200"
              }`}
            >
              <span className="text-xl">{unlocked ? "🏆" : "🔒"}</span>
            </div>
            <div className="flex flex-col gap-1 flex-grow">
              <div className="text-header font-header text-skrawl-purple">{badge.name}</div>
              <p className="text-body font-body text-skrawl-black text-sm">{badge.description ?? "Unlock by playing!"}</p>
              <span className={`text-xs font-body uppercase tracking-wide ${unlocked ? "text-skrawl-purple" : "text-gray-500"}`}>
                {unlocked ? "✓ Unlocked" : "Locked"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OwnedBadges;
