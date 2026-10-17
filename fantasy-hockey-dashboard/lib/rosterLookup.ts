import { ROSTERS, YOUR_TEAM, RosteredPlayer } from "./rosters";

// Normalizes a player name for matching across data sources that don't
// format names identically (diacritics, punctuation, spacing) — e.g. Dom's
// spreadsheet vs. the NHL API's skaterFullName/goalieFullName fields.
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[.'\-]/g, "") // drop periods, apostrophes, hyphens
    .replace(/\s+/g, " ")
    .trim();
}

// Names shared by two different NHL players (same name, different position),
// so name alone can't identify a player. Matching for these also uses the
// position group (D / G / forward). Add to this list if another pair turns up.
export const AMBIGUOUS_NAMES = new Set(["elias pettersson", "sebastian aho"]);

/** "D", "G" or "F" (any forward) from a position code: C, L, R, LW, RW, D, G. */
export function posGroup(pos: string | null | undefined): "D" | "G" | "F" {
  const p = String(pos ?? "").toUpperCase();
  return p.startsWith("D") ? "D" : p.startsWith("G") ? "G" : "F";
}

/** Identity key for a player: the normalized name, plus the position group for
 * the few names two NHL players share (the two Elias Petterssons). */
export function playerKey(name: string, pos?: string | null): string {
  const n = normalizeName(name);
  return AMBIGUOUS_NAMES.has(n) && pos ? `${n}|${posGroup(pos)}` : n;
}

// Built once at module load: player key -> team name.
const OWNER_INDEX: Map<string, string> = (() => {
  const index = new Map<string, string>();
  for (const [team, players] of Object.entries(ROSTERS)) {
    for (const p of players) {
      index.set(playerKey(p.name, p.pos), team);
    }
  }
  return index;
})();

/** Returns the team name that rosters this player, or null if unowned
 * (a true free agent) as of the last roster import. */
export function findOwner(playerName: string, pos?: string | null): string | null {
  return OWNER_INDEX.get(playerKey(playerName, pos)) ?? null;
}

export function isOnYourTeam(playerName: string): boolean {
  return findOwner(playerName) === YOUR_TEAM;
}

export function allTeamNames(): string[] {
  return Object.keys(ROSTERS);
}

export function rosterForTeam(team: string): RosteredPlayer[] {
  return ROSTERS[team] ?? [];
}

export { YOUR_TEAM };
