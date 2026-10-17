// Team makeup: every roster rated by tier, graded against the rest of the
// league, with a keep / watch / drop signal per player. Pure functions only.
//
// A player's tier is the same blended tier the Skaters/Goalies tables use
// (this season's VOR percentile pulled toward last season's), so the two
// views always agree. A player with too few games this season (injured,
// just called up) is rated on last season alone; with no data in either
// season he is Unrated.
import { scoreSkaters, scoreGoalies } from "./scoring";
import { playerKey } from "./rosterLookup";
import { effectiveRosterEntriesForTeam, effectiveOwner, type OwnershipMap } from "./effectiveRoster";
import { LEAGUE_CONFIG } from "./leagueConfig";
import { ROSTERS } from "./rosters";
import { latestTeam, tierForRank, starterCount, isGoodPlus, type TierName } from "./tableFilters";
import { lookupInjury, type InjuryInfo } from "./injuries";

export type Group = "F" | "D" | "G";
export type Slot = "Lineup" | "Bench" | "IR" | "Reserve";
export type Signal = "Core" | "Keep" | "Watch" | "Drop candidate" | "IR" | "Unrated";

export const MIN_GP_SKATER = 3; // same pool as the Skaters tab default
export const MIN_GP_GOALIE = 2;

export type MakeupPlayer = {
  name: string;
  playerId: number | null;
  pos: string; // C | LW | RW | D | G
  group: Group;
  nhl: string;
  slot: Slot;
  injury: InjuryInfo | null;
  gp: number;
  tier: TierName | null;
  lyTier: TierName | null;
  score: number | null; // 0..1 blended percentile
  basis: "blend" | "current" | "lastSeason" | null;
  signal: Signal;
  why: string;
  better: { name: string; team: string; tier: TierName } | null;
};

export type TeamRating = {
  rating: number; // 0-100, 50 = league average
  grade: string;
  rank: number;
  groups: Record<Group, number>;
  strongest: Group;
  weakest: Group;
  holes: number; // lineup players rated Replacement
  note: string;
};

export type MakeupTeam = {
  team: string;
  players: MakeupPlayer[];
  counts: Record<TierName, number>; // IR and Reserve not counted
  rating: TeamRating;
};

const TIER_WORTH: Record<TierName, number> = { Superstar: 10, Elite: 6, Good: 3, Depth: 1, Replacement: 0 };
const TIER_ORDER: TierName[] = ["Replacement", "Depth", "Good", "Elite", "Superstar"];
const tierRank = (t: TierName) => TIER_ORDER.indexOf(t);
const GROUP_NAME: Record<Group, string> = { F: "forwards", D: "defence", G: "goaltending" };

// ---- scoring one pool -------------------------------------------------------

function percentiles(scores: { id: number; v: number }[]): Map<number, number> {
  const s = [...scores].sort((a, b) => b.v - a.v);
  const out = new Map<number, number>();
  s.forEach((r, i) => out.set(r.id, s.length > 1 ? 1 - i / (s.length - 1) : 1));
  return out;
}

type KindModel = {
  byName: Map<string, any>; // every raw record (incl. below the pool)
  curPct: Map<number, number>; // pool members only
  lyPct: Map<number, number>;
  lyTier: Map<number, TierName>;
  poolScoresDesc: number[]; // blended score of every pool member
  blend: (id: number) => { score: number | null; basis: MakeupPlayer["basis"] };
  tierOfScore: (score: number) => TierName;
};

function buildKind(
  kind: "skaters" | "goalies",
  raw: any[],
  ly: any[] | null,
  weights: Record<string, number>,
  lyWeight: number
): KindModel {
  const minGp = kind === "skaters" ? MIN_GP_SKATER : MIN_GP_GOALIE;
  const score = kind === "skaters" ? scoreSkaters : scoreGoalies;
  const starters = starterCount(kind);

  const pool = raw.filter((p) => Number(p.gamesPlayed) >= minGp);
  const curScored: any[] = pool.length ? score(pool, weights) : [];
  const curPct = percentiles(curScored.map((p) => ({ id: p.playerId, v: p.overallScore })));

  const lyScored: any[] = ly && ly.length ? score(ly, weights) : [];
  const lyPct = percentiles(lyScored.map((p) => ({ id: p.playerId, v: p.overallScore })));
  const lyTier = new Map<number, TierName>();
  [...lyScored]
    .sort((a, b) => b.overallScore - a.overallScore)
    .forEach((p, i) => lyTier.set(p.playerId, tierForRank(i, starters)));

  const blend: KindModel["blend"] = (id) => {
    const c = curPct.get(id);
    const l = lyPct.get(id);
    if (c != null && l != null) return { score: lyWeight > 0 ? (1 - lyWeight) * c + lyWeight * l : c, basis: lyWeight > 0 ? "blend" : "current" };
    if (c != null) return { score: c, basis: "current" };
    if (l != null) return { score: l, basis: "lastSeason" };
    return { score: null, basis: null };
  };

  const poolScoresDesc = pool
    .map((p) => blend(p.playerId).score as number)
    .sort((a, b) => b - a);
  // Rank = how many pool members out-score him, so players outside the pool
  // (rated on last season) slot into the same ladder.
  const tierOfScore = (sc: number) => {
    let rank = 0;
    while (rank < poolScoresDesc.length && poolScoresDesc[rank] > sc) rank++;
    return tierForRank(rank, starters);
  };

  return { byName: new Map(raw.map((p) => [playerKey(p.name, kind === "goalies" ? "G" : p.position), p])), curPct, lyPct, lyTier, poolScoresDesc, blend, tierOfScore };
}

// ---- lineup fit -------------------------------------------------------------

// Greedy fill of the real lineup slots from the best players down. Injured
// "Out" players take the IR slots first; whatever doesn't fit the lineup or
// the 5 bench spots is a reserve (NA / overflow) stash.
function assignSlots(players: MakeupPlayer[]): void {
  const R = LEAGUE_CONFIG.roster;
  const byScore = (a: MakeupPlayer, b: MakeupPlayer) => (b.score ?? -1) - (a.score ?? -1);

  const out = players.filter((p) => p.injury?.severity === "out").sort(byScore);
  out.slice(0, R.IR).forEach((p) => (p.slot = "IR"));

  const open = players.filter((p) => p.slot !== "IR").sort(byScore);
  const left = { C: R.C, LW: R.LW, RW: R.RW, F: R.F, D: R.D, Util: R.Util, G: R.G };
  let bench = R.BN;
  for (const p of open) {
    let placed = false;
    if (p.group === "G") {
      if (left.G > 0) (left.G--, (placed = true));
    } else {
      const key = p.pos as "C" | "LW" | "RW" | "D";
      if (left[key] > 0) (left[key]--, (placed = true));
      else if (p.group === "F" && left.F > 0) (left.F--, (placed = true));
      else if (left.Util > 0) (left.Util--, (placed = true));
    }
    if (placed) p.slot = "Lineup";
    else if (bench > 0) (bench--, (p.slot = "Bench"));
    else p.slot = "Reserve";
  }
}

// ---- team rating ------------------------------------------------------------

function worth(p: MakeupPlayer): number {
  if (!p.tier || p.slot === "IR" || p.slot === "Reserve") return 0;
  return TIER_WORTH[p.tier] * (p.slot === "Bench" ? 0.4 : 1);
}

function gradeOf(z: number): string {
  const steps: [number, string][] = [[1.4, "A+"], [1.0, "A"], [0.65, "A-"], [0.35, "B+"], [0.1, "B"], [-0.1, "B-"], [-0.35, "C+"], [-0.65, "C"], [-1.0, "C-"], [-1.4, "D"]];
  for (const [min, g] of steps) if (z >= min) return g;
  return "F";
}

function spread(xs: number[]) {
  const mean = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length || 1));
  return { mean, sd: Math.max(sd, 0.5) }; // floor so near-identical teams don't blow up the scale
}

// ---- main -------------------------------------------------------------------

export function buildMakeup(args: {
  rawSkaters: any[];
  rawGoalies: any[];
  lySkaters: any[] | null;
  lyGoalies: any[] | null;
  weights: Record<string, number>;
  lyWeight: number;
  ownership: OwnershipMap;
  injuries: Record<string, InjuryInfo> | null;
  teamNames?: string[];
}): MakeupTeam[] {
  const { rawSkaters, rawGoalies, weights, lyWeight, ownership, injuries } = args;
  const sk = buildKind("skaters", rawSkaters, args.lySkaters, weights, lyWeight);
  const go = buildKind("goalies", rawGoalies, args.lyGoalies, weights, lyWeight);
  const teamNames = args.teamNames ?? Object.keys(ROSTERS);

  const posOf = (code: string | undefined, fallback: string | undefined): { pos: string; group: Group } => {
    const c = (code ?? fallback ?? "").toUpperCase();
    if (c.startsWith("G")) return { pos: "G", group: "G" };
    if (c.startsWith("D")) return { pos: "D", group: "D" };
    if (c === "L" || c.startsWith("LW")) return { pos: "LW", group: "F" };
    if (c === "R" || c.startsWith("RW")) return { pos: "RW", group: "F" };
    return { pos: "C", group: "F" };
  };

  // Free agents ranked best-first per group, for the "Available" upgrade.
  const owned = (n: string, pos: string) => effectiveOwner(n, ownership, pos) != null;
  const faPool: Record<Group, { name: string; team: string; score: number; tier: TierName }[]> = { F: [], D: [], G: [] };
  for (const [kind, model, raw] of [["skaters", sk, rawSkaters], ["goalies", go, rawGoalies]] as const) {
    for (const p of raw) {
      if (!model.curPct.has(p.playerId) || owned(p.name, kind === "goalies" ? "G" : p.position)) continue;
      const b = model.blend(p.playerId);
      if (b.score == null) continue;
      const g: Group = kind === "goalies" ? "G" : p.position === "D" ? "D" : "F";
      faPool[g].push({ name: p.name, team: latestTeam(p.team), score: b.score, tier: model.tierOfScore(b.score) });
    }
  }
  (Object.keys(faPool) as Group[]).forEach((g) => faPool[g].sort((a, b) => b.score - a.score));

  const teams = teamNames.map((team) => {
    const players: MakeupPlayer[] = [];
    for (const { name, pos: rosterPos } of effectiveRosterEntriesForTeam(team, ownership)) {
      const gRec = go.byName.get(playerKey(name, "G"));
      const sRec = gRec ? undefined : sk.byName.get(playerKey(name, rosterPos));
      const rec = gRec ?? sRec;
      const { pos, group } = posOf(gRec ? "G" : sRec?.position, rosterPos ?? undefined);
      const model = group === "G" ? go : sk;
      const id: number | null = rec?.playerId ?? null;
      const b = id != null ? model.blend(id) : { score: null, basis: null as MakeupPlayer["basis"] };
      const tier = b.score != null ? model.tierOfScore(b.score) : null;
      const lyTier = id != null ? model.lyTier.get(id) ?? null : null;
      players.push({
        name,
        playerId: id,
        pos,
        group,
        nhl: rec ? latestTeam(rec.team) : "",
        slot: "Reserve",
        injury: lookupInjury(injuries, name, rec ? (gRec ? "G" : sRec?.position) : rosterPos),
        gp: rec ? Number(rec.gamesPlayed) || 0 : 0,
        tier,
        lyTier,
        score: b.score,
        basis: b.basis,
        signal: "Unrated",
        why: "",
        better: null,
      });
    }

    assignSlots(players);

    for (const p of players) {
      if (p.slot === "IR") {
        p.signal = "IR";
        p.why = `Out${p.injury?.detail ? ` (${p.injury.detail})` : ""}: on injured reserve`;
      } else if (!p.tier) {
        p.signal = "Unrated";
        p.why = "No games this season or last";
      } else if (tierRank(p.tier) >= 2) {
        p.signal = "Core";
        p.why = `${p.tier}${p.basis === "lastSeason" ? " on last season's numbers" : ""}: a player you build around`;
      } else if (p.tier === "Depth") {
        p.signal = "Keep";
        p.why = "Depth: starter level for this league";
      } else if (isGoodPlus(p.lyTier)) {
        p.signal = "Watch";
        p.why = `Replacement so far, but ${p.lyTier} last season`;
      } else if (p.slot === "Reserve") {
        p.signal = "Keep";
        p.why = "Stash spot (NA / overflow): not counted toward the team grade";
      } else {
        p.signal = "Drop candidate";
        p.why = "Replacement: below the starter line";
      }
      if ((p.signal === "Drop candidate" || p.signal === "Watch") && p.score != null) {
        const f = faPool[p.group].find((x) => x.score > (p.score as number) + 0.02 && tierRank(x.tier) >= 1);
        if (f) p.better = { name: f.name, team: f.team, tier: f.tier };
      }
    }

    players.sort(
      (a, b) =>
        ["F", "D", "G"].indexOf(a.group) - ["F", "D", "G"].indexOf(b.group) || (b.score ?? -1) - (a.score ?? -1)
    );
    const counts: Record<TierName, number> = { Superstar: 0, Elite: 0, Good: 0, Depth: 0, Replacement: 0 };
    for (const p of players) if (p.tier && p.slot !== "IR" && p.slot !== "Reserve") counts[p.tier]++;
    return { team, players, counts, rating: undefined as unknown as TeamRating };
  });

  // Grade every team against the others.
  const raw = teams.map((t) => {
    const g: Record<Group, number> = { F: 0, D: 0, G: 0 };
    for (const p of t.players) g[p.group] += worth(p);
    return { g, total: g.F + g.D + g.G };
  });
  const all = spread(raw.map((r) => r.total));
  const by = { F: spread(raw.map((r) => r.g.F)), D: spread(raw.map((r) => r.g.D)), G: spread(raw.map((r) => r.g.G)) };
  const scaled = (v: number, s: { mean: number; sd: number }) =>
    Math.round(Math.max(0, Math.min(100, 50 + (15 * (v - s.mean)) / s.sd)));
  const order = raw.map((r, i) => ({ i, total: r.total })).sort((a, b) => b.total - a.total);
  teams.forEach((t, i) => {
    const r = raw[i];
    const groups = { F: scaled(r.g.F, by.F), D: scaled(r.g.D, by.D), G: scaled(r.g.G, by.G) };
    const ranked = (["F", "D", "G"] as Group[]).sort((a, b) => groups[b] - groups[a]);
    const holes = t.players.filter((p) => p.slot === "Lineup" && p.tier === "Replacement").length;
    const top = t.counts.Superstar + t.counts.Elite;
    t.rating = {
      rating: scaled(r.total, all),
      grade: gradeOf((r.total - all.mean) / all.sd),
      rank: order.findIndex((o) => o.i === i) + 1,
      groups,
      strongest: ranked[0],
      weakest: ranked[2],
      holes,
      note: `${top} Superstar/Elite ${top === 1 ? "player" : "players"}; strongest at ${GROUP_NAME[ranked[0]]}, thinnest at ${GROUP_NAME[ranked[2]]}${holes > 0 ? `; ${holes} Replacement-level in the lineup` : ""}`,
    };
  });
  return teams;
}
