import { SKATER_CATEGORIES, GOALIE_CATEGORIES } from "./leagueConfig";

// Percentile engine for the Radar tab. Pure functions, no React, so the
// math can be reasoned about (and tested) separately from the chart UI.

export type RadarBasis = "perGame" | "totals";
export type RadarPoolScope = "rostered" | "all";
export type RadarGroupBasis = "all" | "group";

export type RadarAxis = {
  key: string;
  abbrev: string;
  label: string;
  /** lower raw value is better (GAA) — percentile is flipped so farther out is always better */
  invert: boolean;
  /** counting stat that gets divided by games played in "per game" mode */
  perGameable: boolean;
  /** rate stat whose sample size matters (shooting %) */
  needsVolume: boolean;
};

function toAxis(c: {
  key: string;
  abbrev: string;
  label: string;
  type: string;
  higherIsBetter: boolean;
}): RadarAxis {
  return {
    key: c.key,
    abbrev: c.abbrev,
    label: c.label,
    invert: !c.higherIsBetter,
    perGameable: c.type === "counting",
    needsVolume: c.key === "shootingPct",
  };
}

// Axes come straight from the league config so they can never drift from
// the categories in Yahoo Scoring & Settings.
export const SKATER_AXES: RadarAxis[] = SKATER_CATEGORIES.map(toAxis);
export const GOALIE_AXES: RadarAxis[] = GOALIE_CATEGORIES.map(toAxis);

export type RadarOptions = {
  minGP: number;
  basis: RadarBasis;
  scope: RadarPoolScope;
  groupBasis: RadarGroupBasis;
};

export type RadarEntry = {
  playerId: number;
  name: string;
  team: string;
  position: string; // C | L | R | D | G
  isGoalie: boolean;
  gamesPlayed: number;
  owner: string | null;
  /** value on each axis, in the units the chart is using (per game or total) */
  values: number[];
  /** 0-100 percentile on each axis; farther out is always better */
  pct: number[];
  /** simple unweighted mean of the axis percentiles */
  avg: number;
  /** true where the sample behind that axis is thin (e.g. SH% on few shots) */
  thin: boolean[];
};

export type RadarResult = {
  skaters: RadarEntry[];
  goalies: RadarEntry[];
  skaterPoolSize: number;
  goaliePoolSize: number;
  medianGP: number;
  minShots: number;
};

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function lowerBound(a: number[], v: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (a[m] < v) lo = m + 1;
    else hi = m;
  }
  return lo;
}

function upperBound(a: number[], v: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (a[m] <= v) lo = m + 1;
    else hi = m;
  }
  return lo;
}

/**
 * Share of the pool this value beats, on a 0-100 scale, with ties counted
 * as half. Anyone at or below the pool minimum plots at the center and
 * anyone at or above the maximum plots on the outer ring. That way a
 * category like SHP, where most of the pool is at zero, doesn't hand a
 * zero-SHP player a free 30th percentile.
 */
export function percentileOf(sorted: number[], v: number): number {
  const n = sorted.length;
  if (!n) return 0;
  if (v <= sorted[0]) return 0;
  if (v >= sorted[n - 1]) return 100;
  const lo = lowerBound(sorted, v);
  const hi = upperBound(sorted, v);
  return ((lo + 0.5 * (hi - lo)) / n) * 100;
}

function axisValue(row: any, ax: RadarAxis, basis: RadarBasis): number {
  const raw = Number(row[ax.key]) || 0;
  if (ax.perGameable && basis === "perGame") {
    const gp = Number(row.gamesPlayed) || 0;
    return gp > 0 ? raw / gp : 0;
  }
  return raw;
}

function build(
  rows: any[],
  axes: RadarAxis[],
  isGoalie: boolean,
  opts: RadarOptions,
  ownerOf: (name: string) => string | null,
  minShots: number
): { entries: RadarEntry[]; poolSize: number } {
  const qualified = rows.filter((r) => (Number(r.gamesPlayed) || 0) >= opts.minGP);

  const withOwner = qualified.map((r) => ({
    row: r,
    owner: ownerOf(String(r.name)),
    group: isGoalie ? "G" : r.position === "D" ? "D" : "F",
  }));

  // Pool the percentiles are computed against. "Rostered" is the
  // fantasy-relevant yardstick (am I better than what's actually on
  // rosters?), but falls back to everyone if too few players are rostered
  // for the percentile to mean anything.
  let pool = withOwner;
  if (opts.scope === "rostered") {
    const rostered = withOwner.filter((p) => p.owner !== null);
    if (rostered.length >= (isGoalie ? 8 : 40)) pool = rostered;
  }

  const sortedFor = (group: string, ai: number): number[] => {
    const ax = axes[ai];
    let src = pool;
    if (!isGoalie && opts.groupBasis === "group") src = src.filter((p) => p.group === group);
    if (ax.needsVolume) src = src.filter((p) => (Number(p.row.shots) || 0) >= minShots);
    const vals = src.map((p) => {
      const v = axisValue(p.row, ax, opts.basis);
      return ax.invert ? -v : v;
    });
    return vals.sort((a, b) => a - b);
  };

  // Cache sorted arrays: one per (group, axis).
  const cache = new Map<string, number[]>();
  const getSorted = (group: string, ai: number) => {
    const g = !isGoalie && opts.groupBasis === "group" ? group : "*";
    const k = `${g}:${ai}`;
    let s = cache.get(k);
    if (!s) {
      s = sortedFor(group, ai);
      cache.set(k, s);
    }
    return s;
  };

  const entries: RadarEntry[] = withOwner.map((p) => {
    const values = axes.map((ax) => axisValue(p.row, ax, opts.basis));
    const pct = axes.map((ax, ai) => {
      const v = ax.invert ? -values[ai] : values[ai];
      return percentileOf(getSorted(p.group, ai), v);
    });
    const thin = axes.map((ax) =>
      ax.needsVolume ? (Number(p.row.shots) || 0) < minShots : false
    );
    return {
      playerId: Number(p.row.playerId),
      name: String(p.row.name),
      team: String(p.row.team ?? ""),
      position: isGoalie ? "G" : String(p.row.position ?? ""),
      isGoalie,
      gamesPlayed: Number(p.row.gamesPlayed) || 0,
      owner: p.owner,
      values,
      pct,
      avg: pct.reduce((a, b) => a + b, 0) / pct.length,
      thin,
    };
  });

  return { entries, poolSize: pool.length };
}

export function computeRadar(
  rawSkaters: any[],
  rawGoalies: any[],
  opts: RadarOptions,
  ownerOf: (name: string) => string | null
): RadarResult {
  const qualifiedSk = rawSkaters.filter((r) => (Number(r.gamesPlayed) || 0) >= opts.minGP);
  const medianGP = median(qualifiedSk.map((r) => Number(r.gamesPlayed) || 0));
  // SH% on a handful of shots is noise. Require roughly 1.5 shots per game
  // of the typical player's schedule, with a floor of 10, so the bar rises
  // as the season goes on (about 100 shots by late season).
  const minShots = Math.max(10, Math.round(medianGP * 1.5));

  const sk = build(rawSkaters, SKATER_AXES, false, opts, ownerOf, minShots);
  const gl = build(rawGoalies, GOALIE_AXES, true, opts, ownerOf, minShots);

  return {
    skaters: sk.entries,
    goalies: gl.entries,
    skaterPoolSize: sk.poolSize,
    goaliePoolSize: gl.poolSize,
    medianGP,
    minShots,
  };
}

export function formatAxisValue(ax: RadarAxis, v: number, basis: RadarBasis): string {
  if (ax.key === "shootingPct" || ax.key === "savePct") {
    // NHL API gives these as fractions (0.123, 0.912)
    return ax.key === "savePct" ? v.toFixed(3).replace(/^0/, "") : `${(v * 100).toFixed(1)}%`;
  }
  if (ax.key === "goalsAgainstAverage") return v.toFixed(2);
  if (ax.perGameable && basis === "perGame") return v.toFixed(2);
  return String(Math.round(v));
}
