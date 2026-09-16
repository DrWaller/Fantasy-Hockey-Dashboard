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

// The Stats REST API (lib/nhlApi.ts, used for player team fields) uses a
// different abbreviation style than the Web API's tricodes above for a
// handful of teams. Bridges the two so schedule lookups by player team
// actually match.
const STATS_ABBREV_TO_TRICODE: Record<string, string> = {
  "L.A": "LAK",
  "N.J": "NJD",
  "S.J": "SJS",
  "T.B": "TBL",
};
export function toTricode(statsApiAbbrev: string): string {
  return STATS_ABBREV_TO_TRICODE[statsApiAbbrev] ?? statsApiAbbrev;
}

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

export type GameGridDay = { date: string; label: string };

export type GameGridTeamRow = {
  team: string;
  playsOn: Record<string, boolean>;
  gamesThisWeek: number;
  offNightCredits: number; // weighted sum — more credit for lighter league nights
  weekScore: number;
};

export type GameGrid = {
  days: GameGridDay[];
  dailyTotals: Record<string, number>;
  rows: GameGridTeamRow[];
};

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * Builds a team-by-day schedule grid for the next `numDays`, in the spirit
 * of FHF Hockey's Game Grid tool. Week Score is our own approximation of
 * that idea, not a copy of their (undisclosed) exact formula:
 *   weekScore = (teamGames - leagueAvgGames) * 6 + weightedOffNightCredits * 4
 * Off-night credit per game day is weighted toward league-wide LIGHTER
 * nights (fewer total games across the league that day = more credit),
 * normalized against a 12-game league-wide night as the "heavy" ceiling.
 * We don't have a win-odds data source, so unlike FHF's grid this omits
 * that component rather than approximating it.
 */
export async function getWeeklyGameGrid(
  season: string,
  numDays = 7,
  startDateISO?: string
): Promise<GameGrid> {
  const start = startDateISO ? new Date(`${startDateISO}T00:00:00`) : new Date();
  start.setHours(0, 0, 0, 0);
  const days: GameGridDay[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = `${DAY_LABELS[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
    days.push({ date: iso, label });
  }
  const windowStart = days[0].date;
  const windowEnd = days[days.length - 1].date;

  const results = await Promise.all(
    TEAM_TRICODES.map((team) => fetchTeamSeasonSchedule(team, season))
  );

  const dailyTotals: Record<string, number> = {};
  days.forEach((d) => (dailyTotals[d.date] = 0));
  const seenGameIds = new Set<number>();
  const teamGameDates: Record<string, Set<string>> = {};

  results.forEach((games, i) => {
    const team = TEAM_TRICODES[i];
    const datesForTeam = new Set<string>();
    for (const g of games) {
      if (g.gameType !== 2) continue;
      const date = gameDateOf(g);
      if (!date || date < windowStart || date > windowEnd) continue;
      datesForTeam.add(date);
      if (!seenGameIds.has(g.id)) {
        seenGameIds.add(g.id);
        dailyTotals[date] = (dailyTotals[date] ?? 0) + 1;
      }
    }
    teamGameDates[team] = datesForTeam;
  });

  const totalTeamGames = TEAM_TRICODES.reduce(
    (a, t) => a + teamGameDates[t].size,
    0
  );
  const leagueAvgGames = totalTeamGames / TEAM_TRICODES.length;

  const rows: GameGridTeamRow[] = TEAM_TRICODES.map((team) => {
    const dates = teamGameDates[team];
    const playsOn: Record<string, boolean> = {};
    let offNightCredits = 0;
    days.forEach((d) => {
      const plays = dates.has(d.date);
      playsOn[d.date] = plays;
      if (plays) {
        const dayTotal = dailyTotals[d.date] || 0;
        const weight = Math.max(0, Math.min(1, (12 - dayTotal) / 12));
        offNightCredits += weight;
      }
    });
    const gamesThisWeek = dates.size;
    const adjustedGames = gamesThisWeek - leagueAvgGames;
    const weekScore = adjustedGames * 6 + offNightCredits * 4;
    return { team, playsOn, gamesThisWeek, offNightCredits, weekScore };
  }).sort((a, b) => b.weekScore - a.weekScore);

  return { days, dailyTotals, rows };
}
