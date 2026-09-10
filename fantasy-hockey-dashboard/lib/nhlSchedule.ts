// NHL schedule client — server-side only (same CORS caveat as nhlApi.ts).
// Used for games-remaining and heavy/light schedule-day calculations,
// which need no Yahoo data at all — pure NHL schedule.

const WEB_BASE = "https://api-web.nhle.com/v1";

// Standard NHL tri-codes for the Web API's schedule endpoints (distinct
// from the "L.A" / "N.J" style abbreviations the Stats REST API uses).
export const TEAM_TRICODES = [
  "ANA", "BOS", "BUF", "CGY", "CAR", "CHI", "COL", "CBJ", "DAL", "DET",
  "EDM", "FLA", "LAK", "MIN", "MTL", "NSH", "NJD", "NYI", "NYR", "OTT",
  "PHI", "PIT", "SJS", "SEA", "STL", "TBL", "TOR", "UTA", "VAN", "VGK",
  "WSH", "WPG",
] as const;

type ScheduleGame = {
  id: number;
  gameType: number; // 2 = regular season, 3 = playoffs
  gameDate?: string; // "YYYY-MM-DD"
  startTimeUTC?: string; // ISO datetime, fallback if gameDate absent
  awayTeam: { abbrev: string };
  homeTeam: { abbrev: string };
};

function gameDateOf(g: ScheduleGame): string {
  if (g.gameDate) return g.gameDate;
  return (g.startTimeUTC ?? "").slice(0, 10);
}

async function fetchTeamSeasonSchedule(
  team: string,
  season: string
): Promise<ScheduleGame[]> {
  const url = `${WEB_BASE}/club-schedule-season/${team}/${season}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 21600 }, // schedules barely change — cache 6h
  });
  if (!res.ok) {
    throw new Error(`NHL schedule request failed (${team}): ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return (json.games ?? []) as ScheduleGame[];
}

/**
 * Returns a team's most recently completed regular-season games, most
 * recent first — used by the Zero-G goalie-starts feature to know which
 * games to pull boxscores for.
 */
export async function getTeamRecentCompletedGames(
  team: string,
  season: string,
  count: number
): Promise<{ gameId: number; date: string }[]> {
  const games = await fetchTeamSeasonSchedule(team, season);
  const todayISO = new Date().toISOString().slice(0, 10);
  return games
    .filter((g) => g.gameType === 2 && gameDateOf(g) && gameDateOf(g) < todayISO)
    .sort((a, b) => gameDateOf(b).localeCompare(gameDateOf(a)))
    .slice(0, count)
    .map((g) => ({ gameId: g.id, date: gameDateOf(g) }));
}

/**
 * Fetches every team's full-season schedule once, and returns:
 *  - gamesRemaining: regular-season games left per team from today forward
 *  - dailyGameCounts: total league-wide games per date (for a heavy/light
 *    day calendar) — deduplicated, since each game appears in both teams'
 *    individual schedules.
 */
export async function getSeasonScheduleSummary(season: string) {
  const todayISO = new Date().toISOString().slice(0, 10);

  const results = await Promise.all(
    TEAM_TRICODES.map((team) => fetchTeamSeasonSchedule(team, season))
  );

  const gamesRemaining: Record<string, number> = {};
  const seenGameIds = new Set<number>();
  const dailyGameCounts: Record<string, number> = {};

  results.forEach((games, i) => {
    const team = TEAM_TRICODES[i];
    let remaining = 0;
    for (const g of games) {
      if (g.gameType !== 2) continue; // regular season only
      const date = gameDateOf(g);
      if (!date) continue;
      if (date >= todayISO) remaining++;

      if (!seenGameIds.has(g.id)) {
        seenGameIds.add(g.id);
        dailyGameCounts[date] = (dailyGameCounts[date] ?? 0) + 1;
      }
    }
    gamesRemaining[team] = remaining;
  });

  return { gamesRemaining, dailyGameCounts, asOf: todayISO };
}
