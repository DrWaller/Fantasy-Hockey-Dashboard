import { NextRequest, NextResponse } from "next/server";
import { getGoalies, currentSeasonId, previousSeasonId } from "@/lib/nhlApi";
import { scoreGoalies, estimateGoalieReplacementLevel } from "@/lib/scoring";
import { getLeagueGoalieStartLogs, goalieRecentPattern } from "@/lib/nhlGoalieStarts";
import { getAllOverrides } from "@/lib/rosterOverrides";
import { buildEffectiveOwnership, effectiveOwner } from "@/lib/effectiveRoster";

export const revalidate = 43200; // 12 hours — goalie job battles don't move hourly

export async function GET(req: NextRequest) {
  const seasonParam = req.nextUrl.searchParams.get("season");
  const gamesPerTeam = Number(req.nextUrl.searchParams.get("gamesPerTeam") ?? 5);
  const lastN = Number(req.nextUrl.searchParams.get("lastN") ?? 3);

  try {
    let season = seasonParam ?? currentSeasonId();
    let rawGoalies = await getGoalies(season);

    if (!seasonParam && rawGoalies.filter((g) => Number(g.gamesPlayed) > 0).length < 20) {
      season = previousSeasonId();
      rawGoalies = await getGoalies(season);
    }

    // Default (equal) category weights — Zero-G targeting is about
    // opportunity, not fine-tuned category value, so this deliberately
    // ignores the dashboard's slider weights and uses a neutral baseline.
    const scored = scoreGoalies(rawGoalies);
    const { replacementScore } = estimateGoalieReplacementLevel(scored as any);

    // Below-replacement AND not already rostered by anyone (including
    // your own bench) — this is the real "actually available" filter,
    // now checked against live ownership (baseline + add/drop overrides).
    const overrides = await getAllOverrides();
    const ownership = buildEffectiveOwnership(overrides);
    const belowReplacement = scored.filter(
      (g) => g.overallScore < replacementScore && effectiveOwner((g as any).name, ownership) === null
    );

    const startLogs = await getLeagueGoalieStartLogs(season, gamesPerTeam);

    const candidates = belowReplacement
      .map((g) => {
        const log = startLogs[(g as any).team];
        const pattern = goalieRecentPattern(log, (g as any).playerId, lastN);
        return { ...g, ...pattern };
      })
      // Zero-G signal: started at least 2 of the recent window, OR is on
      // a 2+ game current starting streak.
      .filter((g) => g.startsInLastN >= 2 || g.currentStreak >= 2)
      .sort((a, b) => {
        if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
        if (b.startsInLastN !== a.startsInLastN) return b.startsInLastN - a.startsInLastN;
        return b.overallScore - a.overallScore;
      });

    return NextResponse.json({ season, replacementScore, lastN, candidates });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to compute Zero-G targets" },
      { status: 502 }
    );
  }
}
