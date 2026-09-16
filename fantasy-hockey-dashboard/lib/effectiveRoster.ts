import { ROSTERS, YOUR_TEAM } from "./rosters";
import { normalizeName } from "./rosterLookup";
import type { OverrideEntry } from "./rosterOverrides";

export type OwnershipEntry = { team: string | null; displayName: string };
export type OwnershipMap = Map<string, OwnershipEntry>;

/**
 * Merges the static draft-night baseline with live overrides into one
 * lookup: normalized player name -> {team, displayName}. Overrides always
 * win over baseline, including team:null (an explicit drop to free
 * agency), since that's the point of the overlay.
 */
export function buildEffectiveOwnership(
  overrides: Record<string, OverrideEntry>
): OwnershipMap {
  const map: OwnershipMap = new Map();
  for (const [team, players] of Object.entries(ROSTERS)) {
    for (const p of players) {
      map.set(normalizeName(p.name), { team, displayName: p.name });
    }
  }
  for (const [key, entry] of Object.entries(overrides)) {
    map.set(key, { team: entry.team, displayName: entry.playerName });
  }
  return map;
}

export function effectiveOwner(playerName: string, ownership: OwnershipMap): string | null {
  return ownership.get(normalizeName(playerName))?.team ?? null;
}

export function effectiveRosterForTeam(team: string, ownership: OwnershipMap): string[] {
  const names: string[] = [];
  ownership.forEach((entry) => {
    if (entry.team === team) names.push(entry.displayName);
  });
  return names;
}

export { YOUR_TEAM };
