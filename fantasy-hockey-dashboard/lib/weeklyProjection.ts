import { SKATER_CATEGORIES, GOALIE_CATEGORIES } from "./leagueConfig";
import { buildRosterPlayersForTeam, computeDailyLineups } from "./rosterOptimizer";
import type { GameGrid } from "./rosterOptimizer";
import { normalizeName } from "./rosterLookup";
import type { OwnershipMap } from "./effectiveRoster";

export type CategoryConfidence = "high" | "medium" | "low";

// How much to trust a weekly projection per category. High-volume,
// low-variance-per-game stats (shots, hits, blocks) are genuinely
// predictable at a weekly scale — they happen many times a game with
// small game-to-game swings. Low-frequency binary events (wins,
// shutouts) are much noisier and heavily depend on matchup/goaltending
// decisions this model has no visibility into.
const CONFIDENCE: Record<string, CategoryConfidence> = {
  shots: "high",
  hits: "high",
  blockedShots: "high",
  goals: "medium",
  assists: "medium",
  ppPoints: "medium",
  shPoints: "medium",
  shootingPct: "medium",
  savePct: "medium",
  goalsAgainstAverage: "medium",
  wins: "low",
  shutouts: "low",
};

export function getCategoryConfidence(key: string): CategoryConfidence {
  return CONFIDENCE[key] ?? "medium";
}

export type TeamWeekProjection = {
  team: string;
  projected: Record<string, number>;
  goalieStartsUsed: number;
};

/**
 * Projects a team's weekly category totals from their optimal lineup:
 * for every day in the grid, simulate the daily lineup (same engine as
 * the Optimizer tab), and for every player who'd actually be started
 * that day, add one game's worth of their season per-game rate. Summed
 * across the week, this gives a projected weekly total per category.
 *
 * Rate categories (SH%, SV%, GAA) are derived from the projected raw
 * volume components (goals/shots, saves/shots-against), not averaged
 * directly — same volume-weighting philosophy as the rest of the app.
 */
export function projectTeamWeek(
  team: string,
  rawSkaters: any[],
  rawGoalies: any[],
  ownership: OwnershipMap,
  grid: GameGrid
): TeamWeekProjection {
  const rosterPlayers = buildRosterPlayersForTeam(team, rawSkaters, rawGoalies, ownership);
  const lineups = computeDailyLineups(rosterPlayers, grid);

  const skatersByName = new Map(rawSkaters.map((s) => [normalizeName(s.name), s]));
  const goaliesByName = new Map(rawGoalies.map((g) => [normalizeName(g.name), g]));

  const acc: Record<string, number> = {};
  SKATER_CATEGORIES.forEach((c) => {
    if (c.type === "counting") acc[c.key] = 0;
  });
  GOALIE_CATEGORIES.forEach((c) => {
    if (c.type === "counting") acc[c.key] = 0;
  });

  let totalGoals = 0;
  let totalShots = 0;
  let totalShotsAgainst = 0;
  let totalSaves = 0;
  let goalieStartsUsed = 0;

  lineups.forEach((day) => {
    day.started.forEach((p) => {
      if (p.position === "G") {
        const g = goaliesByName.get(normalizeName(p.name));
        if (!g) return;
        const gp = Number(g.gamesPlayed) || 0;
        if (gp === 0) return;
        const perGameShotsAgainst = (Number(g.shotsAgainst) || 0) / gp;
        const savePct = Number(g.savePct) || 0;
        totalShotsAgainst += perGameShotsAgainst;
        totalSaves += perGameShotsAgainst * savePct;
        acc.wins += (Number(g.wins) || 0) / gp;
        acc.shutouts += (Number(g.shutouts) || 0) / gp;
        goalieStartsUsed += 1;
      } else {
        const s = skatersByName.get(normalizeName(p.name));
        if (!s) return;
        const gp = Number(s.gamesPlayed) || 0;
        if (gp === 0) return;
        const perGame = (key: string) => (Number(s[key]) || 0) / gp;
        acc.goals += perGame("goals");
        acc.assists += perGame("assists");
        acc.ppPoints += perGame("ppPoints");
        acc.shPoints += perGame("shPoints");
        acc.shots += perGame("shots");
        acc.hits += perGame("hits");
        acc.blockedShots += perGame("blockedShots");
        totalGoals += perGame("goals");
        totalShots += perGame("shots");
      }
    });
  });

  const projected: Record<string, number> = { ...acc };
  projected.shootingPct = totalShots > 0 ? totalGoals / totalShots : 0;
  projected.savePct = totalShotsAgainst > 0 ? totalSaves / totalShotsAgainst : 0;
  const totalGoalsAgainst = totalShotsAgainst - totalSaves;
  projected.goalsAgainstAverage = goalieStartsUsed > 0 ? totalGoalsAgainst / goalieStartsUsed : 0;

  return { team, projected, goalieStartsUsed };
}

export type MatchupCall = "toss-up" | "lean" | "favored";

/** A simple, clearly-heuristic (not a statistical model) read on how
 * close a category projects to be: margin as a fraction of the larger
 * side's projected total. */
export function callMatchup(
  yourValue: number,
  oppValue: number,
  higherIsBetter: boolean
): { call: MatchupCall; leader: "you" | "opponent" | "even" } {
  const diff = higherIsBetter ? yourValue - oppValue : oppValue - yourValue;
  const scale = Math.max(Math.abs(yourValue), Math.abs(oppValue), 1);
  const pct = Math.abs(diff) / scale;

  if (diff === 0) return { call: "toss-up", leader: "even" };
  const leader = diff > 0 ? "you" : "opponent";
  if (pct < 0.1) return { call: "toss-up", leader };
  if (pct < 0.3) return { call: "lean", leader };
  return { call: "favored", leader };
}
