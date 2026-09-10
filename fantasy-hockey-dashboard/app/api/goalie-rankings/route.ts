import { NextRequest, NextResponse } from "next/server";
import { getGoalies, currentSeasonId, previousSeasonId } from "@/lib/nhlApi";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const seasonParam = searchParams.get("season");
  const minGames = Number(searchParams.get("minGames") ?? 2);

  try {
    let season = seasonParam ?? currentSeasonId();
    let goalies = await getGoalies(season);

    if (!seasonParam && goalies.filter((g) => Number(g.gamesPlayed) > 0).length < 20) {
      season = previousSeasonId();
      goalies = await getGoalies(season);
    }

    const eligible = goalies.filter((g) => Number(g.gamesPlayed) >= minGames);

    return NextResponse.json({ season, players: eligible });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch NHL goalie data" },
      { status: 502 }
    );
  }
}
