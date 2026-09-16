"use client";

import { useEffect, useMemo, useState } from "react";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES } from "@/lib/leagueConfig";
import { computeTeamCategoryTotals, rankTeamsByCategory } from "@/lib/leagueTeams";
import { allTeamNames, YOUR_TEAM } from "@/lib/rosterLookup";
import type { OwnershipMap } from "@/lib/effectiveRoster";
import { matchupForWeek, weekDateRange, weekNumberForDate } from "@/lib/matchupSchedule";
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
  const currentWeekNum = useMemo(() => weekNumberForDate(new Date()), []);
  const currentMatchup = currentWeekNum ? matchupForWeek(currentWeekNum) : undefined;
  const currentRange = currentWeekNum ? weekDateRange(currentWeekNum) : null;

  const [opponent, setOpponent] = useState<string | null>(null);
  const [isOverride, setIsOverride] = useState(false);
  const [opponentLoading, setOpponentLoading] = useState(true);
  const [opponentError, setOpponentError] = useState<string | null>(null);

  const [thisWeekGrid, setThisWeekGrid] = useState<any>(null);
  const [nextWeekGrid, setNextWeekGrid] = useState<any>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [gridLoading, setGridLoading] = useState(true);

  // Default to the auto-detected opponent from the matchup schedule; a
  // saved manual override (in case the Week 1 date assumption is off)
  // takes precedence when present.
  useEffect(() => {
    fetch("/api/opponent")
      .then((r) => r.json())
      .then((res) => {
        if (res.opponent) {
          setOpponent(res.opponent);
          setIsOverride(true);
        } else if (currentMatchup) {
          setOpponent(currentMatchup.opponentRosterKey);
          setIsOverride(false);
        }
      })
      .catch(() => {
        if (currentMatchup) setOpponent(currentMatchup.opponentRosterKey);
      })
      .finally(() => setOpponentLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentWeekNum) {
      setGridLoading(false);
      setGridError("Today's date falls outside the 23-week matchup schedule.");
      return;
    }
    const thisRange = weekDateRange(currentWeekNum);
    const nextRange = weekDateRange(currentWeekNum + 1);
    setGridLoading(true);
    setGridError(null);
    Promise.all([
      fetch(`/api/week-grid?start=${thisRange.start}`).then((r) => r.json()),
      fetch(`/api/week-grid?start=${nextRange.start}`).then((r) => r.json()),
    ])
      .then(([tw, nw]) => {
        if (tw.error) throw new Error(tw.error);
        if (nw.error) throw new Error(nw.error);
        setThisWeekGrid(tw.grid);
        setNextWeekGrid(nw.grid);
      })
      .catch((e) => setGridError(e.message))
      .finally(() => setGridLoading(false));
  }, [currentWeekNum]);

  async function handleOpponentChange(team: string | null) {
    setOpponent(team);
    setIsOverride(true);
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

  async function resetToAutoDetected() {
    if (!currentMatchup) return;
    setIsOverride(false);
    setOpponent(currentMatchup.opponentRosterKey);
    try {
      await fetch("/api/opponent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponent: null }),
      });
    } catch {
      // non-fatal
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
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="font-mono text-xs uppercase tracking-wide text-rink-ice/50">
            Who are you playing this week?
          </label>
          {currentWeekNum && currentRange && (
            <span className="font-mono text-xs text-rink-ice/40">
              Week {currentWeekNum} &middot; {currentRange.start} to {currentRange.end}
              {currentMatchup?.rivalryWeek && (
                <span className="ml-1 text-rink-line">&middot; Rivalry Week</span>
              )}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          {isOverride && currentMatchup && (
            <button
              onClick={resetToAutoDetected}
              className="font-mono text-xs text-rink-gold hover:underline"
            >
              Reset to auto-detected ({currentMatchup.opponentDisplayName})
            </button>
          )}
        </div>
        {opponentError && (
          <p className="mt-2 font-mono text-xs text-rink-line">{opponentError}</p>
        )}
        <p className="mt-2 font-mono text-xs text-rink-ice/40">
          {isOverride
            ? "Manually set — overrides the auto-detected schedule below."
            : "Auto-detected from your season matchup schedule. Week 1 is assumed to start Sept 28, 2026 — correct it above if Yahoo shows something different, and every other week shifts with it."}
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
