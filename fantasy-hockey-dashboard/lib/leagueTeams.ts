import { SKATER_CATEGORIES, GOALIE_CATEGORIES } from "./leagueConfig";
import { allTeamNames, normalizeName } from "./rosterLookup";
import { effectiveRosterForTeam, OwnershipMap } from "./effectiveRoster";

type RawSkater = Record<string, any>;
type RawGoalie = Record<string, any>;

export type TeamCategoryTotals = {
  team: string;
  skaterCounts: number; // how many rostered skaters we found live data for
  goalieCounts: number;
  values: Record<string, number>; // category key -> aggregate value
};

/**
 * Aggregates every team's rostered players' live current-season stats into
 * team-level category totals, properly volume-weighting the rate stats
 * (SH%, SV%, GAA) rather than naively averaging them. Rosters reflect the
 * live add/drop overlay (ownership), not just the draft-night baseline.
 */
export function computeTeamCategoryTotals(
  rawSkaters: RawSkater[],
  rawGoalies: RawGoalie[],
  ownership: OwnershipMap
): TeamCategoryTotals[] {
  const skatersByName = new Map(rawSkaters.map((s) => [normalizeName(s.name), s]));
  const goaliesByName = new Map(rawGoalies.map((g) => [normalizeName(g.name), g]));

  return allTeamNames().map((team) => {
    const rosterNames = effectiveRosterForTeam(team, ownership);
    const teamSkaters: RawSkater[] = [];
    const teamGoalies: RawGoalie[] = [];

    rosterNames.forEach((name) => {
      const key = normalizeName(name);
      const s = skatersByName.get(key);
      if (s) teamSkaters.push(s);
      const g = goaliesByName.get(key);
      if (g) teamGoalies.push(g);
    });

    const values: Record<string, number> = {};

    // Skater counting categories — simple sums.
    for (const cat of SKATER_CATEGORIES) {
      if (cat.type !== "counting") continue;
      values[cat.key] = teamSkaters.reduce((a, s) => a + (Number(s[cat.key]) || 0), 0);
    }
    // SH% — volume-weighted: total goals / total shots, not an average of rates.
    const totalGoals = teamSkaters.reduce((a, s) => a + (Number(s.goals) || 0), 0);
    const totalShots = teamSkaters.reduce((a, s) => a + (Number(s.shots) || 0), 0);
    values.shootingPct = totalShots > 0 ? totalGoals / totalShots : 0;

    // Goalie counting categories.
    for (const cat of GOALIE_CATEGORIES) {
      if (cat.type !== "counting") continue;
      values[cat.key] = teamGoalies.reduce((a, g) => a + (Number(g[cat.key]) || 0), 0);
    }
    // SV% and GAA — derived from real volume (shotsAgainst), not averaged rates.
    const totalShotsAgainst = teamGoalies.reduce(
      (a, g) => a + (Number(g.shotsAgainst) || 0),
      0
    );
    const totalSaves = teamGoalies.reduce(
      (a, g) => a + (Number(g.shotsAgainst) || 0) * (Number(g.savePct) || 0),
      0
    );
    const totalGoalieGP = teamGoalies.reduce((a, g) => a + (Number(g.gamesPlayed) || 0), 0);
    values.savePct = totalShotsAgainst > 0 ? totalSaves / totalShotsAgainst : 0;
    const totalGoalsAgainst = totalShotsAgainst - totalSaves;
    values.goalsAgainstAverage = totalGoalieGP > 0 ? totalGoalsAgainst / totalGoalieGP : 0;

    return {
      team,
      skaterCounts: teamSkaters.length,
      goalieCounts: teamGoalies.length,
      values,
    };
  });
}

/** Ranks every team 1 (best) to N (worst) for a given category, respecting
 * whether higher or lower is better for that category. */
export function rankTeamsByCategory(
  totals: TeamCategoryTotals[],
  categoryKey: string,
  higherIsBetter: boolean
): Map<string, number> {
  const sorted = [...totals].sort((a, b) =>
    higherIsBetter
      ? b.values[categoryKey] - a.values[categoryKey]
      : a.values[categoryKey] - b.values[categoryKey]
  );
  const ranks = new Map<string, number>();
  sorted.forEach((t, i) => ranks.set(t.team, i + 1));
  return ranks;
}
