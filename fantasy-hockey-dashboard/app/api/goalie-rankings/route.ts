import { NextRequest, NextResponse } from "next/server";
import {
  getGoalies,
  currentSeasonId,
  previousSeasonId,
  etDateDaysAgo,
} from "@/lib/nhlApi";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const seasonParam = searchParams.get("season");
  const minGames = Number(searchParams.get("minGames") ?? 2);
  const daysParam = Number(searchParams.get("days") ?? 0);
  const days = [7, 15, 30].includes(daysParam) ? daysParam : 0;

  try {
    if (days > 0) {
      const season = seasonParam ?? currentSeasonId();
      const since = etDateDaysAgo(days);
      const goalies = await getGoalies(season, since);
      const eligible = goalies.filter((g) => Number(g.gamesPlayed) >= minGames);
      return NextResponse.json({
        season,
        fallback: false,
        window: { days, since },
        players: eligible,
      });
    }

    let season = seasonParam ?? currentSeasonId();
    let goalies = await getGoalies(season);
    let fallback = false;

    if (!seasonParam && goalies.filter((g) => Number(g.gamesPlayed) > 0).length < 20) {
      season = previousSeasonId();
      goalies = await getGoalies(season);
      fallback = true;
    }

    const eligible = goalies.filter((g) => Number(g.gamesPlayed) >= minGames);

    return NextResponse.json({ season, fallback, players: eligible });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch NHL goalie data" },
      { status: 502 }
    );
  }
}
