import { ROSTERS, YOUR_TEAM, RosteredPlayer } from "./rosters";
import { playerKey } from "./rosterLookup";
import type { OverrideEntry } from "./rosterOverrides";

export type OwnershipEntry = { team: string | null; displayName: string; pos?: string | null };
export type OwnershipMap = Map<string, OwnershipEntry>;

/**
 * Merges a roster baseline with live overrides into one lookup:
 * normalized player name -> {team, displayName}. Overrides always win
 * over baseline, including team:null (an explicit drop to free agency).
 *
 * `baseline` defaults to the static draft-night snapshot, but the caller
 * can pass in a live-synced Yahoo roster snapshot instead (same shape) —
 * everything downstream (League tab, Optimizer, Week strategy) is
 * agnostic to which source it came from.
 */
export function buildEffectiveOwnership(
  overrides: Record<string, OverrideEntry>,
  baseline: Record<string, RosteredPlayer[]> = ROSTERS
): OwnershipMap {
  const map: OwnershipMap = new Map();
  for (const [team, players] of Object.entries(baseline)) {
    for (const p of players) {
      map.set(playerKey(p.name, p.pos), { team, displayName: p.name, pos: p.pos });
    }
  }
  for (const [key, entry] of Object.entries(overrides)) {
    map.set(key, { team: entry.team, displayName: entry.playerName, pos: entry.pos ?? null });
  }
  return map;
}

export function effectiveOwner(
  playerName: string,
  ownership: OwnershipMap,
  pos?: string | null
): string | null {
  return ownership.get(playerKey(playerName, pos))?.team ?? null;
}

export function effectiveRosterForTeam(team: string, ownership: OwnershipMap): string[] {
  const names: string[] = [];
  ownership.forEach((entry) => {
    if (entry.team === team) names.push(entry.displayName);
  });
  return names;
}

/** Same as effectiveRosterForTeam but keeps each player's position, which is
 * what tells the two Elias Petterssons (C / D) apart. */
export function effectiveRosterEntriesForTeam(
  team: string,
  ownership: OwnershipMap
): { name: string; pos: string | null }[] {
  const out: { name: string; pos: string | null }[] = [];
  ownership.forEach((entry) => {
    if (entry.team === team) out.push({ name: entry.displayName, pos: entry.pos ?? null });
  });
  return out;
}

export { YOUR_TEAM };
