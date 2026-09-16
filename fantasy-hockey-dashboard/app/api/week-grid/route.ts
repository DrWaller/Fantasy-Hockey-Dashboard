import { NextRequest, NextResponse } from "next/server";
import { getWeeklyGameGrid } from "@/lib/nhlSchedule";
import { currentSeasonId } from "@/lib/nhlApi";

export const revalidate = 21600;

export async function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get("start");
  if (!start) {
    return NextResponse.json({ error: "start (YYYY-MM-DD) is required" }, { status: 400 });
  }
  try {
    // Schedule lookups don't need the stats-availability fallback that
    // player stats use — the season's schedule exists as soon as it's
    // published, regardless of whether games (and thus stats) exist yet.
    const season = currentSeasonId();
    const grid = await getWeeklyGameGrid(season, 7, start);
    return NextResponse.json({ season, grid });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch week schedule" },
      { status: 502 }
    );
  }
}
