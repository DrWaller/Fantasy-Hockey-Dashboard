// Per-game starting-goalie detection — powers the Zero-G targets feature.
// KNOWN RISK: unlike the season-total stats endpoints (already verified
// working in production), this uses the boxscore endpoint's exact shape,
// which wasn't testable against the live API from the build environment
// (network egress there is restricted to a small allowlist that doesn't
// include api-web.nhle.com). The heuristic below is based on documented
// community reference implementations, but if it misfires after deploy,
// the most likely culprit is the boxscore goalie-array shape or field
// names below — check those first.

import { TEAM_TRICODES, getTeamRecentCompletedGames } from "./nhlSchedule";

const WEB_BASE = "https://api-web.nhle.com/v1";

type BoxscoreGoalie = {
  playerId: number;
  name?: { default: string };
  toi?: string; // "MM:SS" format
};

type BoxscoreResponse = {
  awayTeam: { abbrev: string };
  homeTeam: { abbrev: string };
  playerByGameStats?: {
    awayTeam: { goalies: BoxscoreGoalie[] };
    homeTeam: { goalies: BoxscoreGoalie[] };
  };
};

function toiToSeconds(toi?: string): number {
  if (!toi) return 0;
  const [m, s] = toi.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

/**
 * For a single game, determines the starting goalie for each team using a
 * most-time-on-ice heuristic (the goalie who played the most of the game).
 * This will occasionally misidentify the starter in the rare case of a
 * very early pull (e.g. starter yanked 3 minutes in) — a real but
 * infrequent edge case for a season-long streak signal.
 */
async function getGameStarters(
  gameId: number
): Promise<Record<string, { playerId: number; name: string }>> {
  const res = await fetch(`${WEB_BASE}/gamecenter/${gameId}/boxscore`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 43200 }, // finished games never change — cache 12h
  });
  if (!res.ok) return {};
  const json: BoxscoreResponse = await res.json();
  const result: Record<string, { playerId: number; name: string }> = {};

  const sides: Array<["awayTeam" | "homeTeam", string]> = [
    ["awayTeam", json.awayTeam?.abbrev],
    ["homeTeam", json.homeTeam?.abbrev],
  ];

  for (const [sideKey, abbrev] of sides) {
    const goalies = json.playerByGameStats?.[sideKey]?.goalies ?? [];
    const played = goalies.filter((g) => toiToSeconds(g.toi) > 0);
    if (played.length === 0) continue;
    const starter = played.reduce((max, g) =>
      toiToSeconds(g.toi) > toiToSeconds(max.toi) ? g : max
    );
    result[abbrev] = {
      playerId: starter.playerId,
      name: starter.name?.default ?? "",
    };
  }
  return result;
}

export type TeamStartLog = {
  team: string;
  // Most recent game first.
  starts: { date: string; playerId: number; name: string }[];
};

/**
 * Builds a recent starting-goalie log for every NHL team. Fetches each
 * team's last `gamesPerTeam` completed games, then dedupes boxscore
 * fetches across teams (every game involves two teams, so this roughly
 * halves the real number of NHL API calls vs. a naive per-team loop).
 */
export async function getLeagueGoalieStartLogs(
  season: string,
  gamesPerTeam = 5
): Promise<Record<string, TeamStartLog>> {
  const perTeamGames = await Promise.all(
    TEAM_TRICODES.map((team) =>
      getTeamRecentCompletedGames(team, season, gamesPerTeam).then((games) => ({
        team,
        games,
      }))
    )
  );

  const uniqueGameIds = new Set<number>();
  perTeamGames.forEach(({ games }) => games.forEach((g) => uniqueGameIds.add(g.gameId)));

  const starterEntries = await Promise.all(
    [...uniqueGameIds].map(async (gameId) => {
      const starters = await getGameStarters(gameId);
      return { gameId, starters };
    })
  );
  const startersByGameId = new Map(starterEntries.map((e) => [e.gameId, e.starters]));

  const logs: Record<string, TeamStartLog> = {};
  perTeamGames.forEach(({ team, games }) => {
    const starts = games
      .map((g) => {
        const starter = startersByGameId.get(g.gameId)?.[team];
        if (!starter) return null;
        return { date: g.date, playerId: starter.playerId, name: starter.name };
      })
      .filter((s): s is { date: string; playerId: number; name: string } => s !== null);
    logs[team] = { team, starts };
  });

  return logs;
}

/**
 * Given a team's start log and a specific goalie, computes:
 *  - startsInLastN: how many of the team's last N logged games this
 *    goalie started (e.g. "2 of last 3")
 *  - currentStreak: consecutive starts by this goalie counting back from
 *    the most recent game (0 if someone else started most recently)
 */
export function goalieRecentPattern(
  log: TeamStartLog | undefined,
  playerId: number,
  lastN: number
): { startsInLastN: number; outOf: number; currentStreak: number } {
  if (!log) return { startsInLastN: 0, outOf: 0, currentStreak: 0 };
  const window = log.starts.slice(0, lastN);
  const startsInLastN = window.filter((s) => s.playerId === playerId).length;

  let currentStreak = 0;
  for (const s of log.starts) {
    if (s.playerId === playerId) currentStreak++;
    else break;
  }

  return { startsInLastN, outOf: window.length, currentStreak };
}
