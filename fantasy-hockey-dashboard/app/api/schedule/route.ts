import { NextRequest, NextResponse } from "next/server";
import { getSeasonScheduleSummary, getWeeklyGameGrid } from "@/lib/nhlSchedule";
import { currentSeasonId } from "@/lib/nhlApi";

export const revalidate = 21600; // 6 hours — schedules don't change often

export async function GET(req: NextRequest) {
  const season = req.nextUrl.searchParams.get("season") ?? currentSeasonId();
  try {
    const [summary, grid] = await Promise.all([
      getSeasonScheduleSummary(season),
      getWeeklyGameGrid(season, 7),
    ]);
    return NextResponse.json({ season, ...summary, grid });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch NHL schedule" },
      { status: 502 }
    );
  }
}
