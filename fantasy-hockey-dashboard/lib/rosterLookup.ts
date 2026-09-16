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

// Built once at module load: normalized player name -> team name.
const OWNER_INDEX: Map<string, string> = (() => {
  const index = new Map<string, string>();
  for (const [team, players] of Object.entries(ROSTERS)) {
    for (const p of players) {
      index.set(normalizeName(p.name), team);
    }
  }
  return index;
})();

/** Returns the team name that rosters this player, or null if unowned
 * (a true free agent) as of the last roster import. */
export function findOwner(playerName: string): string | null {
  return OWNER_INDEX.get(normalizeName(playerName)) ?? null;
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
