"use client";

type ScheduleData = {
  season: string;
  asOf: string;
  gamesRemaining: Record<string, number>;
  dailyGameCounts: Record<string, number>;
};

function dayIntensity(count: number): string {
  // Rough thresholds for a 32-team league: 0 games = off day (all-star
  // break, bye), 1-6 = light, 7-11 = medium, 12+ = heavy slate.
  if (count === 0) return "text-rink-steel/50";
  if (count <= 6) return "text-rink-ice/70";
  if (count <= 11) return "text-rink-gold";
  return "text-rink-line font-semibold";
}

function dayLabel(count: number): string {
  if (count === 0) return "Off day";
  if (count <= 6) return "Light";
  if (count <= 11) return "Medium";
  return "Heavy";
}

export default function ScheduleView({ data }: { data: ScheduleData }) {
  const remainingSorted = Object.entries(data.gamesRemaining).sort(
    (a, b) => b[1] - a[1]
  );

  const upcomingDates = Object.keys(data.dailyGameCounts)
    .filter((d) => d >= data.asOf)
    .sort()
    .slice(0, 21);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h2 className="mb-2 font-display text-lg uppercase tracking-wide text-rink-ice/80">
          Games remaining &mdash; rest of season
        </h2>
        <p className="mb-3 font-mono text-xs text-rink-ice/50">
          Fewer games left means less rest-of-season upside &mdash; useful when
          comparing two similar-value trade or waiver targets.
        </p>
        <div className="max-h-[600px] overflow-y-auto rounded border border-rink-steel/40">
          <table className="w-full border-collapse font-mono text-sm">
            <thead className="sticky top-0 bg-rink-board">
              <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">GP left</th>
              </tr>
            </thead>
            <tbody>
              {remainingSorted.map(([team, count]) => (
                <tr key={team} className="border-b border-rink-steel/10">
                  <td className="px-3 py-1.5 text-rink-ice">{team}</td>
                  <td className="stat-num px-3 py-1.5 text-right text-rink-ice/80">
                    {count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg uppercase tracking-wide text-rink-ice/80">
          Next 3 weeks &mdash; heavy vs. light days
        </h2>
        <p className="mb-3 font-mono text-xs text-rink-ice/50">
          League-wide game count per day. Heavy days favor stacking active
          roster spots; light/off days are when a weak bench spot costs you
          the least &mdash; good windows for streaming or a roster move.
        </p>
        <div className="overflow-hidden rounded border border-rink-steel/40">
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Games</th>
                <th className="px-3 py-2 text-right">Load</th>
              </tr>
            </thead>
            <tbody>
              {upcomingDates.map((date) => {
                const count = data.dailyGameCounts[date];
                return (
                  <tr key={date} className="border-b border-rink-steel/10">
                    <td className="px-3 py-1.5 text-rink-ice/80">{date}</td>
                    <td className={`stat-num px-3 py-1.5 text-right ${dayIntensity(count)}`}>
                      {count}
                    </td>
                    <td className={`px-3 py-1.5 text-right ${dayIntensity(count)}`}>
                      {dayLabel(count)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
