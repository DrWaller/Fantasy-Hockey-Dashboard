// Filter / sort logic for the Skaters and Goalies tables. Pure functions only
// (no React, no fetching) so it can be unit-tested and reused.
import { toTricode } from "./nhlSchedule";
import { leagueWideSlots } from "./leagueConfig";
import type { Role } from "./roles";
import type { InjuryInfo } from "./injuries";

export type Period = "season" | "l7" | "l15" | "l30";
export const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "season", label: "Season", days: 0 },
  { id: "l7", label: "L7", days: 7 },
  { id: "l15", label: "L15", days: 15 },
  { id: "l30", label: "L30", days: 30 },
];

export type PosFilter = "all" | "F" | "C" | "L" | "R" | "D";
export const POS_CHIPS: { id: PosFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "F", label: "F" },
  { id: "C", label: "C" },
  { id: "L", label: "LW" },
  { id: "R", label: "RW" },
  { id: "D", label: "D" },
];

export type TierName = "Superstar" | "Elite" | "Good" | "Depth" | "Replacement";
export const TIER_NAMES: TierName[] = ["Superstar", "Elite", "Good", "Depth", "Replacement"];
// Same names/colours as the sister league site so the badges read the same.
export const TIER_STYLE: Record<TierName, { bg: string; fg: string }> = {
  Superstar: { bg: "#D9A441", fg: "#0C2740" },
  Elite: { bg: "#1B6FB5", fg: "#FFFFFF" },
  Good: { bg: "#4F7FA8", fg: "#FFFFFF" },
  Depth: { bg: "#7C8794", fg: "#FFFFFF" },
  Replacement: { bg: "#B8574A", fg: "#FFFFFF" },
};

export const LINE_OPTIONS = ["L1", "L2", "L3", "L4", "D1", "D2", "D3", "None"] as const;
export const PP_OPTIONS = ["PP1", "PP2", "None"] as const;

export const ROLE_PRESETS: { label: string; lines: string[]; pps: string[] }[] = [
  { label: "L1 + PP1", lines: ["L1"], pps: ["PP1"] },
  { label: "L1/L2 + PP1/PP2", lines: ["L1", "L2"], pps: ["PP1", "PP2"] },
  { label: "D1 + PP1", lines: ["D1"], pps: ["PP1"] },
  { label: "Any PP", lines: [], pps: ["PP1", "PP2"] },
];

export type Filters = {
  pos: PosFilter;
  team: string; // "" = all NHL teams (tri-code)
  tier: "" | TierName;
  playsOn: string; // "" = any day, else YYYY-MM-DD
  search: string;
  statCols: boolean;
  hideInjured: boolean;
  pinLY: boolean; // sort players who were Good+ last season to the top
  lines: string[]; // empty = any
  pps: string[]; // empty = any
};

export const DEFAULT_FILTERS: Filters = {
  pos: "all",
  team: "",
  tier: "",
  playsOn: "",
  search: "",
  statCols: true,
  hideInjured: false,
  pinLY: false,
  lines: [],
  pps: [],
};

/** Latest NHL tri-code from the stats API's `teamAbbrevs` (traded players
 * come back as "NYR,TOR" — the last one is the current team). */
export function latestTeam(teamAbbrevs: string | null | undefined): string {
  const last = String(teamAbbrevs ?? "").split(",").pop()?.trim() ?? "";
  return last ? toTricode(last) : "";
}

/**
 * Tier from VOR rank inside the scored pool. Cutoffs scale with the number of
 * league-wide starter slots S (skaters: C+LW+RW+F+D+Util across 12 teams;
 * goalies: G slots): Superstar = top 8% of S, Elite = next 17%, Good = next
 * 35%, Depth = rest of the starters, Replacement = everyone below the
 * starter line. With ~156 skater starters that's 12 / 27 / 55 / 62 players.
 */
export function computeTiers(
  rows: { playerId: number; valueAboveReplacement: number }[],
  starters: number
): Map<number, TierName> {
  const sorted = [...rows].sort((a, b) => b.valueAboveReplacement - a.valueAboveReplacement);
  const cut = [0.08, 0.25, 0.6, 1].map((f) => Math.round(starters * f));
  const out = new Map<number, TierName>();
  sorted.forEach((r, i) => {
    const tier: TierName =
      i < cut[0] ? "Superstar" : i < cut[1] ? "Elite" : i < cut[2] ? "Good" : i < cut[3] ? "Depth" : "Replacement";
    out.set(r.playerId, tier);
  });
  return out;
}

/** 0..1 percentile of each player's VOR inside the pool (1 = best). */
export function vorPercentiles(
  rows: { playerId: number; valueAboveReplacement: number }[]
): Map<number, number> {
  const sorted = [...rows].sort((a, b) => b.valueAboveReplacement - a.valueAboveReplacement);
  const n = sorted.length;
  const out = new Map<number, number>();
  sorted.forEach((r, i) => out.set(r.playerId, n > 1 ? 1 - i / (n - 1) : 1));
  return out;
}

/**
 * Tier from a blend of this period's standing and last season's. Both are
 * turned into VOR percentiles first (scale-free, so a 7-game window and a
 * full season can be mixed), then blended: (1-w) * current + w * lastSeason.
 * Anyone without a qualifying last season (rookies, too few games) is judged
 * on the current period alone rather than being penalised for it.
 */
export function computeBlendedTiers(
  rows: { playerId: number; valueAboveReplacement: number }[],
  lastSeasonPct: Map<number, number> | null,
  lastSeasonWeight: number,
  starters: number
): Map<number, TierName> {
  const cur = vorPercentiles(rows);
  const blended = rows.map((r) => {
    const c = cur.get(r.playerId) ?? 0;
    const l = lastSeasonPct?.get(r.playerId);
    const b = l == null || lastSeasonWeight <= 0 ? c : (1 - lastSeasonWeight) * c + lastSeasonWeight * l;
    return { playerId: r.playerId, valueAboveReplacement: b };
  });
  return computeTiers(blended, starters);
}

export const isGoodPlus = (t: TierName | null | undefined) =>
  t === "Superstar" || t === "Elite" || t === "Good";

export function starterCount(kind: "skaters" | "goalies"): number {
  const s = leagueWideSlots();
  return kind === "goalies" ? s.G : s.C + s.LW + s.RW + s.F_flex + s.D + s.Util;
}

export type Decorated = {
  name: string;
  position?: string;
  tri: string;
  tier: TierName;
  role: Role | null;
  injury: InjuryInfo | null;
};

export type FilterCtx = {
  kind: "skaters" | "goalies";
  /** tri-code -> { date -> plays } from the schedule grid; null if not loaded */
  schedule: Map<string, Record<string, boolean>> | null;
  /** false when line data failed to load, so role filters are ignored */
  rolesAvailable: boolean;
  injuriesAvailable: boolean;
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function passesFilters(r: Decorated, f: Filters, ctx: FilterCtx): boolean {
  if (f.search && !norm(r.name).includes(norm(f.search.trim()))) return false;
  if (f.team && r.tri !== f.team) return false;
  if (f.tier && r.tier !== f.tier) return false;

  if (ctx.kind === "skaters" && f.pos !== "all") {
    const p = r.position ?? "";
    if (f.pos === "F" ? p === "D" || p === "" : p !== f.pos) return false;
  }

  if (f.playsOn && ctx.schedule) {
    if (!ctx.schedule.get(r.tri)?.[f.playsOn]) return false;
  }

  if (f.hideInjured && ctx.injuriesAvailable && r.injury) return false;

  if (ctx.kind === "skaters" && ctx.rolesAvailable) {
    if (f.lines.length > 0) {
      const line = r.role?.line ?? "None";
      if (!f.lines.includes(line)) return false;
    }
    if (f.pps.length > 0) {
      const pp = r.role?.pp ?? "None";
      if (!f.pps.includes(pp)) return false;
    }
  }
  return true;
}

export function activeFilterCount(f: Filters): number {
  return (
    (f.pos !== "all" ? 1 : 0) +
    (f.team ? 1 : 0) +
    (f.tier ? 1 : 0) +
    (f.playsOn ? 1 : 0) +
    (f.search ? 1 : 0) +
    (f.hideInjured ? 1 : 0) +
    (f.lines.length ? 1 : 0) +
    (f.pps.length ? 1 : 0)
  );
}
