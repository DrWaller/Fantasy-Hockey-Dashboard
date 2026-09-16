"use client";

type Candidate = {
  playerId: number;
  name: string;
  team: string;
  gamesPlayed: number;
  wins: number;
  goalsAgainstAverage: number;
  savePct: number;
  shutouts: number;
  startsInLastN: number;
  outOf: number;
  currentStreak: number;
  overallScore: number;
};

export default function ZeroGView({
  candidates,
  lastN,
}: {
  candidates: Candidate[];
  lastN: number;
}) {
  if (candidates.length === 0) {
    return (
      <p className="font-mono text-sm text-rink-ice/60">
        No waiver-tier goalies are currently showing a hot-hand pattern. Check back
        after games are played — job battles tend to show up mid-week.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-4 max-w-2xl font-mono text-xs text-rink-ice/50">
        True free agents (per your last roster import) who have started {" "}
        <span className="text-rink-gold">2+ of their last {lastN} team games</span>{" "}
        or are on a{" "}
        <span className="text-rink-line">2+ game current starting streak</span> &mdash;
        the pattern a backup taking over a job usually shows before the wider
        market catches on. Ownership is a draft-night snapshot, so a very recent
        add elsewhere won&rsquo;t be excluded yet.
      </p>
      <div className="overflow-x-auto rounded border border-rink-steel/40">
        <table className="w-full min-w-[700px] border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
              <th className="px-3 py-2">Goalie</th>
              <th className="px-3 py-2">Tm</th>
              <th className="px-3 py-2 text-right">Streak</th>
              <th className="px-3 py-2 text-right">Last {lastN}</th>
              <th className="px-3 py-2 text-right">GP</th>
              <th className="px-3 py-2 text-right">W</th>
              <th className="px-3 py-2 text-right">GAA</th>
              <th className="px-3 py-2 text-right">SV%</th>
              <th className="px-3 py-2 text-right">SHO</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((g) => (
              <tr key={g.playerId} className="border-b border-rink-steel/10 hover:bg-rink-steel/10">
                <td className="px-3 py-1.5 text-rink-ice">{g.name}</td>
                <td className="px-3 py-1.5 text-rink-ice/60">{g.team}</td>
                <td
                  className={`stat-num px-3 py-1.5 text-right ${
                    g.currentStreak >= 2 ? "text-rink-line font-semibold" : "text-rink-ice/40"
                  }`}
                >
                  {g.currentStreak}
                </td>
                <td
                  className={`stat-num px-3 py-1.5 text-right ${
                    g.startsInLastN >= 2 ? "text-rink-gold font-semibold" : "text-rink-ice/40"
                  }`}
                >
                  {g.startsInLastN}/{g.outOf}
                </td>
                <td className="stat-num px-3 py-1.5 text-right text-rink-ice/70">{g.gamesPlayed}</td>
                <td className="stat-num px-3 py-1.5 text-right text-rink-ice/70">{g.wins}</td>
                <td className="stat-num px-3 py-1.5 text-right text-rink-ice/70">
                  {g.goalsAgainstAverage.toFixed(2)}
                </td>
                <td className="stat-num px-3 py-1.5 text-right text-rink-ice/70">
                  {(g.savePct * 100).toFixed(1)}
                </td>
                <td className="stat-num px-3 py-1.5 text-right text-rink-ice/70">{g.shutouts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
