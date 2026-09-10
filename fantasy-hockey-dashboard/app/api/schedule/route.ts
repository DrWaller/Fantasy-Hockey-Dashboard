import { NextRequest, NextResponse } from "next/server";
import { getSeasonScheduleSummary } from "@/lib/nhlSchedule";
import { currentSeasonId } from "@/lib/nhlApi";

export const revalidate = 21600; // 6 hours — schedules don't change often

export async function GET(req: NextRequest) {
  const season = req.nextUrl.searchParams.get("season") ?? currentSeasonId();
  try {
    const summary = await getSeasonScheduleSummary(season);
    return NextResponse.json({ season, ...summary });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch NHL schedule" },
      { status: 502 }
    );
  }
}
