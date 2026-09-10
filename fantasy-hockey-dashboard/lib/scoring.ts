import {
  SKATER_CATEGORIES,
  GOALIE_CATEGORIES,
  LEAGUE_CONFIG,
  leagueWideSlots,
} from "./leagueConfig";

type CategoryDef = {
  key: string;
  label: string;
  abbrev: string;
  type: "counting" | "rate";
  higherIsBetter: boolean;
  volumeKey?: string;
};

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdev(values: number[], avg: number): number {
  const variance =
    values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance) || 1; // avoid divide-by-zero
}

/**
 * Computes a per-category value for every player in `pool`, using:
 *  - z-scores for counting stats (relative to the pool's mean/stdev)
 *  - volume-weighted value for rate stats, itself then z-scored, so a
 *    goalie's .930 SV% on 40 shots doesn't outrank .920 on 900 shots.
 *
 * Returns each player annotated with `categoryScores` (per-category z,
 * signed so higher is always better) and `overallScore` (sum, optionally
 * weighted).
 */
export function scorePlayers<T extends Record<string, unknown>>(
  players: T[],
  categories: readonly CategoryDef[],
  weights: Partial<Record<string, number>> = {}
) {
  const categoryStats = categories.map((cat) => {
    if (cat.type === "counting") {
      const values = players.map((p) => Number(p[cat.key]) || 0);
      const avg = mean(values);
      const sd = stdev(values, avg);
      return { cat, avg, sd, kind: "counting" as const };
    } else {
      // Rate stat: value = (player_rate - pool_avg_rate) * player_volume
      const volumeKey = cat.volumeKey!;
      const totalVolume = players.reduce(
        (a, p) => a + (Number(p[volumeKey]) || 0),
        0
      );
      const totalEvents = players.reduce((a, p) => {
        const rate = Number(p[cat.key]) || 0;
        const vol = Number(p[volumeKey]) || 0;
        return a + rate * vol;
      }, 0);
      const poolAvgRate = totalEvents / (totalVolume || 1);

      const weightedValues = players.map((p) => {
        const rate = Number(p[cat.key]) || 0;
        const vol = Number(p[volumeKey]) || 0;
        const diff = cat.higherIsBetter
          ? rate - poolAvgRate
          : poolAvgRate - rate;
        return diff * vol;
      });
      const avg = mean(weightedValues);
      const sd = stdev(weightedValues, avg);
      return { cat, avg, sd, poolAvgRate, kind: "rate" as const };
    }
  });

  return players.map((p) => {
    const categoryScores: Record<string, number> = {};
    let overallScore = 0;

    categoryStats.forEach(({ cat, avg, sd, kind, poolAvgRate }) => {
      let raw: number;
      if (kind === "counting") {
        const value = Number(p[cat.key]) || 0;
        raw = cat.higherIsBetter ? value - avg : avg - value;
      } else {
        const volumeKey = cat.volumeKey!;
        const rate = Number(p[cat.key]) || 0;
        const vol = Number(p[volumeKey]) || 0;
        const diff = cat.higherIsBetter
          ? rate - (poolAvgRate as number)
          : (poolAvgRate as number) - rate;
        raw = diff * vol - avg;
      }
      const z = raw / sd;
      const weight = weights[cat.key] ?? 1;
      categoryScores[cat.key] = z;
      overallScore += z * weight;
    });

    return { ...p, categoryScores, overallScore };
  });
}

export function scoreSkaters<T extends Record<string, unknown>>(
  players: T[],
  weights?: Partial<Record<string, number>>
) {
  return scorePlayers(players, SKATER_CATEGORIES, weights);
}

export function scoreGoalies<T extends Record<string, unknown>>(
  players: T[],
  weights?: Partial<Record<string, number>>
) {
  return scorePlayers(players, GOALIE_CATEGORIES, weights);
}

/**
 * Estimates replacement level by greedily filling league-wide roster slots
 * with the highest-value players at each eligible position, in the order
 * dedicated slots -> flex slots -> utility. The last player assigned is
 * the replacement-level baseline; players ranked below this are streaming/
 * waiver-tier, not typical starters in a 12-team league.
 *
 * `position` on each player must be one of "C" | "L" | "R" | "D".
 */
export function estimateReplacementLevel<
  T extends { position?: string; overallScore: number }
>(scoredSkaters: T[]) {
  const slots = leagueWideSlots();
  const byPosition = {
    C: scoredSkaters
      .filter((p) => p.position === "C")
      .sort((a, b) => b.overallScore - a.overallScore),
    LW: scoredSkaters
      .filter((p) => p.position === "L")
      .sort((a, b) => b.overallScore - a.overallScore),
    RW: scoredSkaters
      .filter((p) => p.position === "R")
      .sort((a, b) => b.overallScore - a.overallScore),
    D: scoredSkaters
      .filter((p) => p.position === "D")
      .sort((a, b) => b.overallScore - a.overallScore),
  };

  const rostered = new Set<T>();

  // Fill dedicated position slots first.
  (["C", "LW", "RW", "D"] as const).forEach((pos) => {
    const need = pos === "LW" ? slots.LW : pos === "RW" ? slots.RW : slots[pos];
    byPosition[pos].slice(0, need).forEach((p) => rostered.add(p));
  });

  // Fill flex forward slots from best remaining forwards (C/LW/RW).
  const remainingForwards = [...byPosition.C, ...byPosition.LW, ...byPosition.RW]
    .filter((p) => !rostered.has(p))
    .sort((a, b) => b.overallScore - a.overallScore);
  remainingForwards.slice(0, slots.F_flex).forEach((p) => rostered.add(p));

  // Fill Util from best remaining skater of any position.
  const remainingAll = scoredSkaters
    .filter((p) => !rostered.has(p))
    .sort((a, b) => b.overallScore - a.overallScore);
  remainingAll.slice(0, slots.Util).forEach((p) => rostered.add(p));

  const rosteredList = [...rostered];
  const replacementPlayer = rosteredList.reduce((min, p) =>
    p.overallScore < min.overallScore ? p : min
  );
  const replacementScore = replacementPlayer.overallScore;

  return {
    replacementScore,
    replacementPlayer,
    rosteredCount: rosteredList.length,
    rosteredPlayerIds: new Set(rosteredList.map((p) => (p as any).playerId)),
  };
}

export function estimateGoalieReplacementLevel<
  T extends { overallScore: number }
>(scoredGoalies: T[]) {
  const slots = leagueWideSlots();
  const sorted = [...scoredGoalies].sort(
    (a, b) => b.overallScore - a.overallScore
  );
  const rostered = sorted.slice(0, slots.G);
  const replacementPlayer = rostered.length ? rostered[rostered.length - 1] : null;
  const replacementScore = replacementPlayer ? replacementPlayer.overallScore : 0;
  return {
    replacementScore,
    replacementPlayer,
    rosteredCount: rostered.length,
    rosteredPlayerIds: new Set(rostered.map((p) => (p as any).playerId)),
  };
}
