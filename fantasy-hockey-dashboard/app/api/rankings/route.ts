import { NextRequest, NextResponse } from "next/server";
import { getJoinedSkaters, currentSeasonId, previousSeasonId } from "@/lib/nhlApi";

export const revalidate = 3600; // re-fetch NHL data at most once an hour

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const seasonParam = searchParams.get("season");
  const minGames = Number(searchParams.get("minGames") ?? 3);

  try {
    let season = seasonParam ?? currentSeasonId();
    let skaters = await getJoinedSkaters(season);

    // Early in the season (or pre-season), current-season data may be
    // sparse or empty — fall back to last season so the dashboard is
    // still useful before/just after puck drop.
    if (!seasonParam && skaters.filter((s) => Number(s.gamesPlayed) > 0).length < 50) {
      season = previousSeasonId();
      skaters = await getJoinedSkaters(season);
    }

    const eligible = skaters.filter((s) => Number(s.gamesPlayed) >= minGames);

    // NOTE: scoring (z-scores, VOR, category weighting) happens client-side
    // in app/page.tsx using lib/scoring.ts, so weight-slider changes don't
    // need to re-hit the NHL API — only minGames/season changes do.
    return NextResponse.json({ season, players: eligible });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch NHL skater data" },
      { status: 502 }
    );
  }
}
