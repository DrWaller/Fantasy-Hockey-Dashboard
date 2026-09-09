// Thin wrapper around the NHL's public (undocumented) stats REST API.
// IMPORTANT: this must only ever be called from server-side code (API routes),
// never from the browser — the NHL API does not set CORS headers for
// arbitrary origins, so client-side fetches will fail.
//
// Reference: https://github.com/Zmalski/NHL-API-Reference

const STATS_BASE = "https://api.nhle.com/stats/rest/en";

export function currentSeasonId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? year : year - 1;
  return `${startYear}${startYear + 1}`;
}

export function previousSeasonId(): string {
  const current = currentSeasonId();
  const startYear = parseInt(current.slice(0, 4), 10) - 1;
  return `${startYear}${startYear + 1}`;
}

async function fetchReport(
  report: "skater/summary" | "skater/realtime" | "goalie/summary",
  seasonId: string,
  gameTypeId = 2
) {
  const cayenneExp = encodeURIComponent(
    `gameTypeId=${gameTypeId} and seasonId=${seasonId}`
  );
  const sortField =
    report === "goalie/summary"
      ? "wins"
      : report === "skater/realtime"
      ? "hits"
      : "points";
  const sort = encodeURIComponent(
    JSON.stringify([{ property: sortField, direction: "DESC" }])
  );
  const url = `${STATS_BASE}/${report}?isAggregate=false&isGame=false&sort=${sort}&start=0&limit=-1&cayenneExp=${cayenneExp}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`NHL API request failed (${report}): ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data as Record<string, unknown>[];
}

export async function getSkaterSummary(seasonId: string) {
  return fetchReport("skater/summary", seasonId);
}

export async function getSkaterRealtime(seasonId: string) {
  return fetchReport("skater/realtime", seasonId);
}

export async function getGoalieSummary(seasonId: string) {
  return fetchReport("goalie/summary", seasonId);
}

export async function getJoinedSkaters(seasonId: string) {
  const [summary, realtime] = await Promise.all([
    getSkaterSummary(seasonId),
    getSkaterRealtime(seasonId),
  ]);

  const realtimeById = new Map(
    realtime.map((r) => [r.playerId as number, r])
  );

  return summary.map((s) => {
    const rt = realtimeById.get(s.playerId as number) ?? {};
    return {
      playerId: s.playerId,
      name: s.skaterFullName,
      team: s.teamAbbrevs,
      position: s.positionCode,
      gamesPlayed: s.gamesPlayed,
      goals: s.goals,
      assists: s.assists,
      points: s.points,
      ppPoints: s.ppPoints,
      shPoints: s.shPoints,
      shots: s.shots,
      shootingPct: s.shootingPct,
      hits: rt.hits ?? 0,
      blockedShots: rt.blockedShots ?? 0,
    };
  });
}

export async function getGoalies(seasonId: string) {
  const goalies = await getGoalieSummary(seasonId);
  return goalies.map((g) => ({
    playerId: g.playerId,
    name: g.goalieFullName,
    team: g.teamAbbrevs,
    gamesPlayed: g.gamesPlayed,
    wins: g.wins,
    goalsAgainstAverage: g.goalsAgainstAverage,
    savePct: g.savePct,
    shotsAgainst: g.shotsAgainst,
    shutouts: g.shutouts,
  }));
}
