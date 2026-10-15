// Infers each skater's line / pair and power-play unit from NHL ice time.
// Used as the fallback when Daily Faceoff can't be read for a team (the
// NHL stats API has per-player even-strength and power-play time but does
// not publish lines).
//
//   forwards ranked by even-strength TOI/game on their team: top 3 = L1, next 3 = L2 ...
//   defence ranked the same way: top 2 = D1, next 2 = D2, ...
//   power play: the 5 skaters with the most PP time on a team = PP1, next 5 = PP2
//     (anyone under 8% of the team's PP time is left off)
// Recent games (last two weeks) win over the full season once a player has
// played at least 2 of them.
import { normalizeName } from "./rosterLookup";
import { toTricode } from "./nhlSchedule";
import { roleKey, initialKey, type Role } from "./roles";

export type TOIRow = {
  name: string;
  team: string; // NHL tri-code (latest team for traded players)
  pos: string; // C | L | R | D
  gp: number;
  ev: number; // even-strength TOI per game, seconds
  ppTotal: number; // total PP TOI, seconds
};

export function parseTOI(data: any[]): (TOIRow & { id: number })[] {
  return (data ?? [])
    .filter((r) => Number(r.gamesPlayed) > 0)
    .map((r) => ({
      id: Number(r.playerId),
      name: String(r.skaterFullName ?? ""),
      team: toTricode(String(r.teamAbbrevs ?? "").split(",").pop()!.trim()),
      pos: String(r.positionCode ?? ""),
      gp: Number(r.gamesPlayed),
      ev: Number(r.evTimeOnIcePerGame) || 0,
      ppTotal: Number(r.ppTimeOnIce) || 0,
    }));
}

export function inferRoles(
  season: (TOIRow & { id?: number })[],
  recent: (TOIRow & { id?: number })[]
): Map<string, Role> {
  const out = new Map<string, Role>();
  const recentBy = new Map(recent.map((r) => [roleKey(r.team, r.name), r] as const));
  const use = (r: TOIRow) => {
    const rr = recentBy.get(roleKey(r.team, r.name));
    return rr && rr.gp >= 2 ? rr : r;
  };
  const teamPP = (rows: TOIRow[]) => {
    const t = new Map<string, number>();
    for (const r of rows) t.set(r.team, (t.get(r.team) ?? 0) + r.ppTotal);
    return t;
  };
  const ppSeason = teamPP(season);
  const ppRecent = teamPP(recent);

  const byTeam = new Map<string, TOIRow[]>();
  for (const r of season) byTeam.set(r.team, [...(byTeam.get(r.team) ?? []), r]);

  byTeam.forEach((rows) => {
    const lineOf = new Map<TOIRow, string>();
    const fwd = rows.filter((r) => r.pos !== "D").sort((a, b) => use(b).ev - use(a).ev);
    fwd.forEach((r, i) => lineOf.set(r, `L${Math.min(4, Math.floor(i / 3) + 1)}`));
    const def = rows.filter((r) => r.pos === "D").sort((a, b) => use(b).ev - use(a).ev);
    def.forEach((r, i) => lineOf.set(r, `D${Math.min(3, Math.floor(i / 2) + 1)}`));

    const ppOf = new Map<TOIRow, "PP1" | "PP2">();
    const ranked = [...rows].sort((a, b) => use(b).ppTotal - use(a).ppTotal);
    ranked.forEach((r, i) => {
      const u = use(r);
      const isRecent = u !== r;
      const teamTotal = (isRecent ? ppRecent.get(r.team) : ppSeason.get(r.team)) ?? 0;
      // Skaters' PP time adds up to ~5x the team's, so divide by 5 for a share.
      const share = teamTotal > 0 ? u.ppTotal / (teamTotal / 5) : 0;
      if (i < 5 && share >= 0.08) ppOf.set(r, "PP1");
      else if (i < 10 && share >= 0.08) ppOf.set(r, "PP2");
    });

    for (const r of rows) {
      out.set(roleKey(r.team, r.name), {
        line: lineOf.get(r) ?? null,
        pp: ppOf.get(r) ?? null,
        src: "inferred",
      });
    }
  });
  return out;
}

// Overlays real Daily Faceoff combinations onto the inferred roles. For a
// team whose page was read, a skater who isn't listed isn't in the lineup, so
// he gets no line / PP unit rather than an inferred one.
export function mergeRoles(
  inferred: Map<string, Role>,
  toi: TOIRow[],
  lines: { players: { name: string; team: string; line: string | null; pp: "PP1" | "PP2" | null }[]; teamsOk: string[] }
): Record<string, Role> {
  const result: Record<string, Role> = {};
  const ok = new Set(lines.teamsOk);
  inferred.forEach((role, key) => {
    if (!ok.has(key.split("|")[0])) result[key] = role;
  });

  // Every skater on a read team starts as "not in the lineup"...
  for (const r of toi) {
    if (ok.has(r.team)) result[roleKey(r.team, r.name)] = { line: null, pp: null, src: "lines" };
  }
  // ...then the Daily Faceoff entries fill in who actually is.
  const toiByInitial = new Map<string, string>();
  for (const r of toi) toiByInitial.set(initialKey(r.team, r.name), roleKey(r.team, r.name));
  for (const p of lines.players) {
    const role: Role = { line: p.line, pp: p.pp, src: "lines" };
    const full = roleKey(p.team, p.name);
    result[full] = role;
    const viaInitial = toiByInitial.get(initialKey(p.team, p.name));
    if (viaInitial && viaInitial !== full) result[viaInitial] = role;
  }
  return result;
}
