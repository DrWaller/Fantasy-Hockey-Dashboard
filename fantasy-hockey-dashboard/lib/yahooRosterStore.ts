// Stores the last-synced live Yahoo roster snapshot in Redis, so the app
// doesn't have to hit Yahoo's API on every single page load. Refreshed
// on connect and whenever /api/yahoo/sync is called (a manual "Refresh
// from Yahoo" action, or could be put on a schedule later).

import { redis } from "./redis";
import { fetchLiveRosters } from "./yahooApi";
import { YOUR_TEAM } from "./rosters";
import type { RosteredPlayer } from "./rosters";

const KEY = "yahoo:rosters";
const SYNCED_AT_KEY = "yahoo:rosters:synced_at";

export async function syncLiveRosters(): Promise<Record<string, RosteredPlayer[]>> {
  const rosters = await fetchLiveRosters(YOUR_TEAM);
  if (redis) {
    await redis.set(KEY, rosters);
    await redis.set(SYNCED_AT_KEY, new Date().toISOString());
  }
  return rosters as Record<string, RosteredPlayer[]>;
}

export async function getLiveRosters(): Promise<{
  rosters: Record<string, RosteredPlayer[]> | null;
  syncedAt: string | null;
}> {
  if (!redis) return { rosters: null, syncedAt: null };
  const [rosters, syncedAt] = await Promise.all([
    redis.get<Record<string, RosteredPlayer[]>>(KEY),
    redis.get<string>(SYNCED_AT_KEY),
  ]);
  return { rosters: rosters ?? null, syncedAt: syncedAt ?? null };
}
