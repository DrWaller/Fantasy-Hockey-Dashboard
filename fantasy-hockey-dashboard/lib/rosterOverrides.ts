// Server-only: reads/writes the live add/drop overlay stored in Redis.
// The draft-night snapshot (lib/rosters.ts) never changes — these
// overrides sit on top of it and win when present, so the whole thing
// stays reversible (clearing an override just falls back to baseline).

import { redis } from "./redis";
import { normalizeName } from "./rosterLookup";

const HASH_KEY = "roster:overrides";

export type OverrideEntry = {
  playerName: string; // display name, original casing
  team: string | null; // null = dropped to free agency
  updatedAt: string;
};

export async function getAllOverrides(): Promise<Record<string, OverrideEntry>> {
  if (!redis) return {}; // no DB configured yet — behave as baseline-only
  const raw = await redis.hgetall<Record<string, OverrideEntry>>(HASH_KEY);
  return raw ?? {};
}

export async function setOverride(playerName: string, team: string | null): Promise<void> {
  if (!redis) {
    throw new Error(
      "Roster database isn't connected yet — add the Upstash Redis integration to this Vercel project first."
    );
  }
  const key = normalizeName(playerName);
  const entry: OverrideEntry = { playerName, team, updatedAt: new Date().toISOString() };
  await redis.hset(HASH_KEY, { [key]: entry });
}

export async function clearOverride(playerName: string): Promise<void> {
  if (!redis) {
    throw new Error(
      "Roster database isn't connected yet — add the Upstash Redis integration to this Vercel project first."
    );
  }
  await redis.hdel(HASH_KEY, normalizeName(playerName));
}
