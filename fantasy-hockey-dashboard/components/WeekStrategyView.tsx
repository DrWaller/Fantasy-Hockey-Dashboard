"use client";

import { useEffect, useMemo, useState } from "react";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES } from "@/lib/leagueConfig";
import { computeTeamCategoryTotals, rankTeamsByCategory } from "@/lib/leagueTeams";
import { allTeamNames, YOUR_TEAM } from "@/lib/rosterLookup";
import type { OwnershipMap } from "@/lib/effectiveRoster";
import { mondayOfWeek, nextMonday } from "@/lib/weekUtils";
import OptimizerView from "./OptimizerView";

const ALL_CATS = [...SKATER_CATEGORIES, ...GOALIE_CATEGORIES];

export default function WeekStrategyView({
  rawSkaters,
  rawGoalies,
  ownership,
}: {
  rawSkaters: any[];
  rawGoalies: any[];
  ownership: OwnershipMap;
}) {
  const [opponent, setOpponent] = useState<string | null>(null);
  const [opponentLoading, setOpponentLoading] = useState(true);
  const [opponentError, setOpponentError] = useState<string | null>(null);

  const [thisWeekGrid, setThisWeekGrid] = useState<any>(null);
  const [nextWeekGrid, setNextWeekGrid] = useState<any>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [gridLoading, setGridLoading] = useState(true);

  useEffect(() => {
    fetch("/api/opponent")
      .then((r) => r.json())
      .then((res) => setOpponent(res.opponent ?? null))
      .catch(() => {})
      .finally(() => setOpponentLoading(false));
  }, []);

  useEffect(() => {
    const thisMonday = mondayOfWeek(new Date());
    const nextMon = nextMonday(thisMonday);
    setGridLoading(true);
    setGridError(null);
    Promise.all([
      fetch(`/api/week-grid?start=${thisMonday}`).then((r) => r.json()),
      fetch(`/api/week-grid?start=${nextMon}`).then((r) => r.json()),
    ])
      .then(([tw, nw]) => {
        if (tw.error) throw new Error(tw.error);
        if (nw.error) throw new Error(nw.error);
        setThisWeekGrid(tw.grid);
        setNextWeekGrid(nw.grid);
      })
      .catch((e) => setGridError(e.message))
      .finally(() => setGridLoading(false));
  }, []);

  async function handleOpponentChange(team: string | null) {
    setOpponent(team);
    try {
      const res = await fetch("/api/opponent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponent: team }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
    } catch (e: any) {
      setOpponentError(e.message ?? "Failed to save opponent");
    }
  }

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

  const yourTotals = totals.find((t) => t.team === YOUR_TEAM);
  const oppTotals = opponent ? totals.find((t) => t.team === opponent) : undefined;

  return (
    <div>
      <div className="mb-6 rounded border border-rink-line/30 bg-rink-ash p-4">
        <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-rink-ice/50">
          Who are you playing this week?
        </label>
        <select
          value={opponent ?? ""}
          onChange={(e) => handleOpponentChange(e.target.value || null)}
          disabled={opponentLoading}
          className="w-full max-w-xs rounded border border-rink-steel/40 bg-rink-board px-2 py-1.5 text-sm text-rink-ice"
        >
          <option value="">Select opponent&hellip;</option>
          {allTeamNames()
            .filter((t) => t !== YOUR_TEAM)
            .map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </select>
        {opponentError && (
          <p className="mt-2 font-mono text-xs text-rink-line">{opponentError}</p>
        )}
        <p className="mt-2 font-mono text-xs text-rink-ice/40">
          Not synced to Yahoo's actual schedule yet &mdash; set this manually each week
          until that lands.
        </p>
      </div>

      {opponent && yourTotals && oppTotals && (
        <div className="mb-8">
          <h2 className="mb-2 font-display text-lg uppercase tracking-wide text-rink-ice/80">
            Matchup focus vs. {opponent}
          </h2>
          <p className="mb-3 max-w-2xl font-mono text-xs text-rink-ice/50">
            Categories you're currently behind in league-wide standing are worth targeting
            this week &mdash; ones you're comfortably ahead in can absorb a down week if it
            frees you up elsewhere.
          </p>
          <div className="overflow-x-auto rounded border border-rink-steel/40">
            <table className="w-full min-w-[600px] border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">You (rank)</th>
                  <th className="px-3 py-2 text-right">{opponent} (rank)</th>
                  <th className="px-3 py-2 text-right">Focus</th>
                </tr>
              </thead>
              <tbody>
                {ALL_CATS.map((cat) => {
                  const yourRank = ranksByCategory[cat.key].get(YOUR_TEAM) ?? 0;
                  const oppRank = ranksByCategory[cat.key].get(opponent) ?? 0;
                  const youBehind = yourRank > oppRank;
                  const gapBig = Math.abs(yourRank - oppRank) >= 5;
                  return (
                    <tr key={cat.key} className="border-b border-rink-steel/10">
                      <td className="px-3 py-1.5 text-rink-ice/80" title={cat.label}>
                        {cat.abbrev}
                      </td>
                      <td className="stat-num px-3 py-1.5 text-right text-rink-ice/70">
                        #{yourRank}
                      </td>
                      <td className="stat-num px-3 py-1.5 text-right text-rink-ice/70">
                        #{oppRank}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {youBehind ? (
                          <span className="text-rink-gold">Target</span>
                        ) : gapBig ? (
                          <span className="text-rink-steel">Safe to punt</span>
                        ) : (
                          <span className="text-rink-ice/40">Close</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {gridLoading && (
        <p className="font-mono text-sm text-rink-ice/60">Loading this week &amp; next week&hellip;</p>
      )}
      {gridError && (
        <p className="font-mono text-sm text-rink-line">Couldn&rsquo;t load week data: {gridError}</p>
      )}

      {!gridLoading && !gridError && thisWeekGrid && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-rink-ice/80">
            This week&rsquo;s roster openings
          </h2>
          <OptimizerView
            rawSkaters={rawSkaters}
            rawGoalies={rawGoalies}
            grid={thisWeekGrid}
            ownership={ownership}
          />
        </div>
      )}

      {!gridLoading && !gridError && nextWeekGrid && (
        <div>
          <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-rink-ice/80">
            Next week&rsquo;s roster openings
          </h2>
          <OptimizerView
            rawSkaters={rawSkaters}
            rawGoalies={rawGoalies}
            grid={nextWeekGrid}
            ownership={ownership}
          />
        </div>
      )}
    </div>
  );
}
