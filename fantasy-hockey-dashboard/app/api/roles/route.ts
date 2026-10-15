import { NextResponse } from "next/server";
import { currentSeasonId } from "@/lib/nhlApi";
import { getLines } from "@/lib/lines";
import { parseTOI, inferRoles, mergeRoles } from "@/lib/usage";
import { etDateDaysAgo } from "@/lib/nhlApi";
import type { RolesPayload } from "@/lib/roles";

export const revalidate = 900; // 15 minutes — lines change often

async function fetchTOI(season: string, since?: string) {
  const exp = `gameTypeId=2 and seasonId=${season}${since ? ` and gameDate>="${since}"` : ""}`;
  const url = `https://api.nhle.com/stats/rest/en/skater/timeonice?isAggregate=false&isGame=false&limit=-1&cayenneExp=${encodeURIComponent(exp)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return parseTOI(json?.data ?? []);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const season = currentSeasonId();
    const [toi, recent, lines] = await Promise.all([
      fetchTOI(season),
      fetchTOI(season, etDateDaysAgo(14)),
      getLines().catch(() => ({ players: [], teamsOk: [], teamsFailed: [], updatedAt: null })),
    ]);

    const inferred = inferRoles(toi, recent);
    const roles = mergeRoles(inferred, toi, lines);
    const payload: RolesPayload = {
      ok: Object.keys(roles).length > 0,
      roles,
      teamsOk: lines.teamsOk,
      teamsFailed: lines.teamsFailed,
      inferredFrom: toi.length > 0,
      updatedAt: lines.updatedAt,
    };
    return NextResponse.json(payload);
  } catch (err: any) {
    const payload: RolesPayload = {
      ok: false,
      roles: {},
      teamsOk: [],
      teamsFailed: [],
      inferredFrom: false,
      updatedAt: null,
      error: err?.message ?? "Failed to load line combinations",
    };
    return NextResponse.json(payload);
  }
}
