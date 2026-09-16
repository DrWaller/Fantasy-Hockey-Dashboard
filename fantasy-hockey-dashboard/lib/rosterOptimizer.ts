import { LEAGUE_CONFIG } from "./leagueConfig";
import { toTricode } from "./nhlSchedule";
import { normalizeName } from "./rosterLookup";
import { effectiveRosterForTeam, effectiveOwner, OwnershipMap, YOUR_TEAM } from "./effectiveRoster";
import { scoreSkaters, scoreGoalies } from "./scoring";

type GameGridDay = { date: string; label: string };
type GameGridTeamRow = { team: string; playsOn: Record<string, boolean> };
type GameGrid = { days: GameGridDay[]; dailyTotals: Record<string, number>; rows: GameGridTeamRow[] };

type RosterPlayer = {
  name: string;
  position: "C" | "LW" | "RW" | "D" | "G";
  nhlTricode: string;
};

function mapPosition(code: string): "C" | "LW" | "RW" | "D" {
  if (code === "L") return "LW";
  if (code === "R") return "RW";
  return code as "C" | "D";
}

/** Cross-references your effective roster against live NHL data to get
 * each rostered player's position and NHL team (in schedule-grid tricode
 * form), which the season-total stats endpoints alone don't tell you. */
export function buildYourRosterPlayers(
  rawSkaters: any[],
  rawGoalies: any[],
  ownership: OwnershipMap
): RosterPlayer[] {
  const names = effectiveRosterForTeam(YOUR_TEAM, ownership);
  const skatersByName = new Map(rawSkaters.map((s) => [normalizeName(s.name), s]));
  const goaliesByName = new Map(rawGoalies.map((g) => [normalizeName(g.name), g]));

  const players: RosterPlayer[] = [];
  names.forEach((name) => {
    const key = normalizeName(name);
    const s = skatersByName.get(key);
    if (s) {
      players.push({ name, position: mapPosition(s.position), nhlTricode: toTricode(s.team) });
      return;
    }
    const g = goaliesByName.get(key);
    if (g) {
      players.push({ name, position: "G", nhlTricode: toTricode(g.team) });
    }
    // Else: no live data for this player (e.g. hasn't played at all this
    // season) — silently excluded from the simulation, a known gap.
  });
  return players;
}

function teamPlaysOn(grid: GameGrid, tricode: string, date: string): boolean {
  const row = grid.rows.find((r) => r.team === tricode);
  return row ? !!row.playsOn[date] : false;
}

export type DailyLineup = {
  date: string;
  label: string;
  filled: Record<string, number>;
  capacity: Record<string, number>;
  openSlots: { type: string; count: number }[];
  benched: { name: string; position: string }[];
};

/** Simulates your actual daily lineup for every day in the grid: which
 * dedicated/flex/util slots get filled by your scheduled rostered
 * players, which sit open (a streaming opportunity), and who gets
 * bumped to the bench because too many of one position play that day. */
export function computeDailyLineups(
  rosterPlayers: RosterPlayer[],
  grid: GameGrid
): DailyLineup[] {
  const cap = LEAGUE_CONFIG.roster;
  const capacityTotals = {
    C: cap.C,
    LW: cap.LW,
    RW: cap.RW,
    F: cap.F,
    D: cap.D,
    Util: cap.Util,
    G: cap.G,
  };

  return grid.days.map((day) => {
    const scheduled = rosterPlayers.filter((p) => teamPlaysOn(grid, p.nhlTricode, day.date));
    const goalies = scheduled.filter((p) => p.position === "G");
    const skaters = scheduled.filter((p) => p.position !== "G");

    const filled: Record<string, number> = { C: 0, LW: 0, RW: 0, F: 0, D: 0, Util: 0, G: 0 };
    const benched: RosterPlayer[] = [];

    goalies.forEach((g) => {
      if (filled.G < capacityTotals.G) filled.G++;
      else benched.push(g);
    });

    const leftover: RosterPlayer[] = [];
    (["C", "LW", "RW", "D"] as const).forEach((pos) => {
      skaters
        .filter((p) => p.position === pos)
        .forEach((p) => {
          if (filled[pos] < capacityTotals[pos]) filled[pos]++;
          else leftover.push(p);
        });
    });

    const leftoverForwards = leftover.filter((p) => p.position !== "D");
    const leftoverD = leftover.filter((p) => p.position === "D");
    const stillLeftover: RosterPlayer[] = [];
    leftoverForwards.forEach((p) => {
      if (filled.F < capacityTotals.F) filled.F++;
      else stillLeftover.push(p);
    });
    stillLeftover.push(...leftoverD);

    stillLeftover.forEach((p) => {
      if (filled.Util < capacityTotals.Util) filled.Util++;
      else benched.push(p);
    });

    const openSlots = Object.entries(capacityTotals)
      .map(([type, total]) => ({ type, count: total - (filled as any)[type] }))
      .filter((o) => o.count > 0);

    return {
      date: day.date,
      label: day.label,
      filled,
      capacity: capacityTotals,
      openSlots,
      benched: benched.map((p) => ({ name: p.name, position: p.position })),
    };
  });
}

export type StreamSuggestion = {
  name: string;
  position: string;
  team: string;
  overallScore: number;
};

/** For a given open-slot type on a given day, finds free agents eligible
 * for that slot whose NHL team plays that day, ranked by default-weighted
 * value. A simple, self-contained scoring pass — not tied to the
 * Skaters/Goalies tabs' slider weights, since this is about opportunity,
 * not fine-tuned category value. */
export function findStreamSuggestions(
  slotType: string,
  date: string,
  grid: GameGrid,
  rawSkaters: any[],
  rawGoalies: any[],
  ownership: OwnershipMap,
  limit = 3
): StreamSuggestion[] {
  if (slotType === "G") {
    const scored = scoreGoalies(rawGoalies);
    return scored
      .filter((g: any) => {
        const owner = effectiveOwner(g.name, ownership);
        if (owner !== null) return false;
        return teamPlaysOn(grid, toTricode(g.team), date);
      })
      .sort((a: any, b: any) => b.overallScore - a.overallScore)
      .slice(0, limit)
      .map((g: any) => ({ name: g.name, position: "G", team: g.team, overallScore: g.overallScore }));
  }

  const eligiblePositions: Record<string, string[]> = {
    C: ["C"],
    LW: ["LW"],
    RW: ["RW"],
    D: ["D"],
    F: ["C", "LW", "RW"],
    Util: ["C", "LW", "RW", "D"],
  };
  const wanted = eligiblePositions[slotType] ?? [];
  const scored = scoreSkaters(rawSkaters);
  return scored
    .filter((s: any) => {
      const pos = mapPosition(s.position);
      if (!wanted.includes(pos)) return false;
      const owner = effectiveOwner(s.name, ownership);
      if (owner !== null) return false;
      return teamPlaysOn(grid, toTricode(s.team), date);
    })
    .sort((a: any, b: any) => b.overallScore - a.overallScore)
    .slice(0, limit)
    .map((s: any) => ({
      name: s.name,
      position: mapPosition(s.position),
      team: s.team,
      overallScore: s.overallScore,
    }));
}

