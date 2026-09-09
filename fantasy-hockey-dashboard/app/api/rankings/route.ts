import { NextRequest, NextResponse } from "next/server";
import { getJoinedSkaters, currentSeasonId, previousSeasonId } from "@/lib/nhlApi";
import { scoreSkaters, estimateReplacementLevel } from "@/lib/scoring";

export const revalidate = 3600; // re-fetch NHL data at most once an hour

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const seasonParam = searchParams.get("season");
  // Games-played floor filters out one-game call-ups skewing rate stats.
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
    const scored = scoreSkaters(eligible);
    const { replacementScore, rosteredPlayerIds } = estimateReplacementLevel(
      scored as any
    );

    const ranked = scored
      .map((p) => ({
        ...p,
        rostered: rosteredPlayerIds.has((p as any).playerId),
        valueAboveReplacement: p.overallScore - replacementScore,
      }))
      .sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({ season, replacementScore, players: ranked });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch NHL skater data" },
      { status: 502 }
    );
  }
}
