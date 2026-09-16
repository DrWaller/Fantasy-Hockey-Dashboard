"use client";

import { useMemo } from "react";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES } from "@/lib/leagueConfig";
import { computeTeamCategoryTotals, rankTeamsByCategory } from "@/lib/leagueTeams";
import { YOUR_TEAM } from "@/lib/rosterLookup";
import type { OwnershipMap } from "@/lib/effectiveRoster";

const ALL_CATS = [...SKATER_CATEGORIES, ...GOALIE_CATEGORIES];

function rankColor(rank: number, total: number): string {
  if (rank <= 3) return "text-rink-line font-semibold";
  if (rank <= 6) return "text-rink-ice/80";
  if (rank <= 9) return "text-rink-ice/50";
  return "text-rink-steel";
}

export default function LeagueView({
  rawSkaters,
  rawGoalies,
  ownership,
}: {
  rawSkaters: any[];
  rawGoalies: any[];
  ownership: OwnershipMap;
}) {
  const totals = useMemo(
    () => computeTeamCategoryTotals(rawSkaters, rawGoalies, ownership),
    [rawSkaters, rawGoalies, ownership]
  );

  const ranksByCategory = useMemo(() => {
    const map: Record<string, Map<string, number>> = {};
    ALL_CATS.forEach((cat) => {
      map[cat.key] = rankTeamsByCategory(totals, cat.key, cat.higherIsBetter);
    });
    return map;
  }, [totals]);

  const yourStrong = ALL_CATS.filter((cat) => (ranksByCategory[cat.key].get(YOUR_TEAM) ?? 99) <= 3);
  const yourWeak = ALL_CATS.filter((cat) => (ranksByCategory[cat.key].get(YOUR_TEAM) ?? 0) >= 10);

  const teamsSorted = [...totals].sort((a, b) =>
    a.team === YOUR_TEAM ? -1 : b.team === YOUR_TEAM ? 1 : a.team.localeCompare(b.team)
  );

  return (
    <div>
      <div className="mb-5 rounded border border-rink-line/30 bg-rink-ash p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-rink-ice/50">
          Your team, right now (live season stats, not projections)
        </p>
        <p className="mt-2 font-mono text-sm">
          <span className="text-rink-line">Strong:</span>{" "}
          {yourStrong.length
            ? yourStrong.map((c) => c.abbrev).join(", ")
            : "nothing standout yet"}
          <span className="mx-3 text-rink-ice/20">|</span>
          <span className="text-rink-steel">Weak:</span>{" "}
          {yourWeak.length ? yourWeak.map((c) => c.abbrev).join(", ") : "no real holes"}
        </p>
        <p className="mt-2 font-mono text-xs text-rink-ice/40">
          Weak categories are the ones worth prioritizing in trades or streaming this week
          &mdash; strong ones you can afford to punt on for a week without losing the category.
        </p>
      </div>

      <div className="overflow-x-auto rounded border border-rink-steel/40">
        <table className="w-full min-w-[1000px] border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
              <th className="px-3 py-2">Team</th>
              {ALL_CATS.map((cat) => (
                <th key={cat.key} className="px-2 py-2 text-right" title={cat.label}>
                  {cat.abbrev}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamsSorted.map((t) => (
              <tr
                key={t.team}
                className={`border-b border-rink-steel/10 ${
                  t.team === YOUR_TEAM ? "bg-rink-line/10" : "hover:bg-rink-steel/10"
                }`}
              >
                <td
                  className={`px-3 py-1.5 ${
                    t.team === YOUR_TEAM ? "font-semibold text-rink-ice" : "text-rink-ice/70"
                  }`}
                >
                  {t.team}
                </td>
                {ALL_CATS.map((cat) => {
                  const rank = ranksByCategory[cat.key].get(t.team) ?? 0;
                  return (
                    <td
                      key={cat.key}
                      className={`stat-num px-2 py-1.5 text-right ${rankColor(rank, totals.length)}`}
                      title={`Rank ${rank} of ${totals.length} in ${cat.label}`}
                    >
                      {rank}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-xs text-rink-ice/40">
        1 = best in the league for that category, {totals.length} = worst. Built from your
        imported roster snapshot &times; live current-season NHL stats, so this reflects actual
        performance so far, not preseason projections.
      </p>
    </div>
  );
}
