import { NextRequest, NextResponse } from "next/server";
import {
  getJoinedSkaters,
  currentSeasonId,
  previousSeasonId,
  etDateDaysAgo,
} from "@/lib/nhlApi";

export const revalidate = 3600; // re-fetch NHL data at most once an hour

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const seasonParam = searchParams.get("season");
  const minGames = Number(searchParams.get("minGames") ?? 3);
  // days=7|15|30 -> only games from the last N days (current season only).
  const daysParam = Number(searchParams.get("days") ?? 0);
  const days = [7, 15, 30].includes(daysParam) ? daysParam : 0;

  try {
    // A date window only makes sense on the live season: last season's
    // "last 7 days" would be April, which is useless. No fallback there.
    if (days > 0) {
      const season = seasonParam ?? currentSeasonId();
      const since = etDateDaysAgo(days);
      const skaters = await getJoinedSkaters(season, since);
      const eligible = skaters.filter((s) => Number(s.gamesPlayed) >= minGames);
      return NextResponse.json({
        season,
        fallback: false,
        window: { days, since },
        players: eligible,
      });
    }

    let season = seasonParam ?? currentSeasonId();
    let skaters = await getJoinedSkaters(season);
    let fallback = false;

    // Early in the season (or pre-season), current-season data may be
    // sparse or empty — fall back to last season so the dashboard is
    // still useful before/just after puck drop.
    if (!seasonParam && skaters.filter((s) => Number(s.gamesPlayed) > 0).length < 50) {
      season = previousSeasonId();
      skaters = await getJoinedSkaters(season);
      fallback = true;
    }

    const eligible = skaters.filter((s) => Number(s.gamesPlayed) >= minGames);

    // NOTE: scoring (z-scores, VOR, category weighting) happens client-side
    // in app/page.tsx using lib/scoring.ts, so weight-slider changes don't
    // need to re-hit the NHL API — only minGames/season/period changes do.
    return NextResponse.json({ season, fallback, players: eligible });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch NHL skater data" },
      { status: 502 }
    );
  }
}
