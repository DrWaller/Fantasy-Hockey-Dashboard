// Server-only: reads/writes the live add/drop overlay stored in Redis.
// The draft-night snapshot (lib/rosters.ts) never changes — these
// overrides sit on top of it and win when present, so the whole thing
// stays reversible (clearing an override just falls back to baseline).

import { redis } from "./redis";
import { playerKey } from "./rosterLookup";

const HASH_KEY = "roster:overrides";

export type OverrideEntry = {
  playerName: string; // display name, original casing
  team: string | null; // null = dropped to free agency
  pos?: string | null; // position code, used to tell same-name players apart
  updatedAt: string;
};

export async function getAllOverrides(): Promise<Record<string, OverrideEntry>> {
  if (!redis) return {}; // no DB configured yet — behave as baseline-only
  const raw = await redis.hgetall<Record<string, OverrideEntry>>(HASH_KEY);
  return raw ?? {};
}

export async function setOverride(playerName: string, team: string | null, pos?: string | null): Promise<void> {
  if (!redis) {
    throw new Error(
      "Roster database isn't connected yet — add the Upstash Redis integration to this Vercel project first."
    );
  }
  const key = playerKey(playerName, pos);
  const entry: OverrideEntry = { playerName, team, pos: pos ?? null, updatedAt: new Date().toISOString() };
  await redis.hset(HASH_KEY, { [key]: entry });
}

export async function clearOverride(playerName: string, pos?: string | null): Promise<void> {
  if (!redis) {
    throw new Error(
      "Roster database isn't connected yet — add the Upstash Redis integration to this Vercel project first."
    );
  }
  await redis.hdel(HASH_KEY, playerKey(playerName, pos));
}

// Wipes every add/drop edit so the baseline in lib/rosters.ts shows through
// again. Used once after the baseline is re-imported, since stale edits
// would otherwise keep overriding the fresh data.
export async function clearAllOverrides(): Promise<void> {
  if (!redis) {
    throw new Error(
      "Roster database isn't connected yet — add the Upstash Redis integration to this Vercel project first."
    );
  }
  await redis.del(HASH_KEY);
}
