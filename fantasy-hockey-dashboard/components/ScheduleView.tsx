"use client";

type GameGridDay = { date: string; label: string };
type GameGridTeamRow = {
  team: string;
  playsOn: Record<string, boolean>;
  gamesThisWeek: number;
  offNightCredits: number;
  weekScore: number;
};
type GameGrid = {
  days: GameGridDay[];
  dailyTotals: Record<string, number>;
  rows: GameGridTeamRow[];
};

type ScheduleData = {
  season: string;
  asOf: string;
  gamesRemaining: Record<string, number>;
  dailyGameCounts: Record<string, number>;
  grid: GameGrid;
};

function dayHeaderColor(count: number): string {
  if (count === 0) return "text-rink-steel/50";
  if (count <= 8) return "text-rink-ice/70"; // off-night, per FHF's own threshold
  return "text-rink-line"; // heavy night
}

function scoreColor(rank: number, total: number): string {
  if (rank <= 5) return "text-rink-line font-semibold"; // top-5 best weeks
  if (rank > total - 5) return "text-rink-steel"; // bottom-5 worst weeks
  return "text-rink-ice/70";
}

export default function ScheduleView({ data }: { data: ScheduleData }) {
  const { grid } = data;
  const rowsRanked = grid.rows; // already sorted best week-score first

  const remainingSorted = Object.entries(data.gamesRemaining).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-1 font-display text-lg uppercase tracking-wide text-rink-ice/80">
          Game grid &mdash; next 7 days
        </h2>
        <p className="mb-3 max-w-2xl font-mono text-xs text-rink-ice/50">
          Teams ranked by Week Score &mdash; games played this week, weighted toward
          lighter league-wide nights (an off-night game is worth more than a heavy-night
          one, since there's less roster-spot competition). Column headers are colored
          by league-wide load that day: <span className="text-rink-ice/70">off-night (&le;8 games)</span>{" "}
          vs <span className="text-rink-line">heavy (&gt;8 games)</span>.
        </p>
        <div className="overflow-x-auto rounded border border-rink-steel/40">
          <table className="w-full min-w-[760px] border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
                <th className="px-3 py-2">Team</th>
                {grid.days.map((d) => (
                  <th
                    key={d.date}
                    className={`px-2 py-2 text-center ${dayHeaderColor(
                      grid.dailyTotals[d.date] ?? 0
                    )}`}
                    title={`${grid.dailyTotals[d.date] ?? 0} games league-wide`}
                  >
                    {d.label}
                  </th>
                ))}
                <th className="px-2 py-2 text-right">GP</th>
                <th className="px-2 py-2 text-right text-rink-gold">Score</th>
              </tr>
            </thead>
            <tbody>
              {rowsRanked.map((row, i) => (
                <tr key={row.team} className="border-b border-rink-steel/10 hover:bg-rink-steel/10">
                  <td className="px-3 py-1.5 text-rink-ice">{row.team}</td>
                  {grid.days.map((d) => (
                    <td key={d.date} className="px-2 py-1.5 text-center">
                      {row.playsOn[d.date] ? (
                        <span className="text-rink-line">&#9679;</span>
                      ) : (
                        <span className="text-rink-steel/30">&middot;</span>
                      )}
                    </td>
                  ))}
                  <td className="stat-num px-2 py-1.5 text-right text-rink-ice/70">
                    {row.gamesThisWeek}
                  </td>
                  <td
                    className={`stat-num px-2 py-1.5 text-right ${scoreColor(
                      i + 1,
                      rowsRanked.length
                    )}`}
                  >
                    {row.weekScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg uppercase tracking-wide text-rink-ice/80">
          Games remaining &mdash; rest of season
        </h2>
        <p className="mb-3 font-mono text-xs text-rink-ice/50">
          Fewer games left means less rest-of-season upside &mdash; useful when
          comparing two similar-value trade or waiver targets.
        </p>
        <div className="max-h-[400px] max-w-md overflow-y-auto rounded border border-rink-steel/40">
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
    </div>
  );
}
