// Yahoo Fantasy Sports API client — server-only.
//
// KNOWN RISK: Yahoo's JSON responses use a distinctive, deeply-nested
// shape (arrays of tiny {key: value} objects, followed by "collection"
// objects keyed "0", "1", ... "count"). This is built from documented
// patterns but has NOT been verified against a live response — there was
// no way to test this from the build environment. If parsing breaks,
// the errors below include a snippet of the raw JSON specifically so we
// can see the actual shape and fix the parsing fast, rather than
// guessing blind.

import { getValidAccessToken } from "./yahooAuth";
import { YAHOO_NAME_TO_ROSTER_KEY } from "./matchupSchedule";

const BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

async function yahooFetch(path: string): Promise<any> {
  const token = await getValidAccessToken();
  const url = `${BASE}/${path}${path.includes("?") ? "&" : "?"}format=json`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Yahoo API ${path} failed: ${res.status} ${text.slice(0, 400)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Yahoo API ${path} returned non-JSON: ${text.slice(0, 400)}`);
  }
}

/** Yahoo frequently returns metadata as an array of tiny single-key
 * objects, e.g. [{team_key: "x"}, {name: "y"}, ...] — flattens that
 * pattern into one plain object. Non-object entries are ignored. */
function flattenMeta(arr: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!Array.isArray(arr)) return out;
  for (const item of arr) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      Object.assign(out, item);
    }
  }
  return out;
}

/** Yahoo "collections" are objects keyed "0", "1", ..., plus a "count"
 * field — returns just the numbered entries as an array. */
function collectionValues(obj: any): any[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj)
    .filter(([k]) => k !== "count")
    .map(([, v]) => v);
}

export type YahooLeagueInfo = { leagueKey: string; gameKey: string; name: string };

/** Finds the current season's NHL fantasy league for the connected user.
 * Assumes exactly one NHL league (true for this use case) — if the
 * account is in multiple, this takes the first. */
export async function discoverLeague(): Promise<YahooLeagueInfo> {
  const json = await yahooFetch("users;use_login=1/games;game_codes=nhl/leagues");
  try {
    const users = collectionValues(json.fantasy_content.users);
    const user = users[0];
    const games = collectionValues(user.user[1].games);
    const game = games[0];
    const gameMeta = flattenMeta(game.game[0]);
    const leagues = collectionValues(game.game[1].leagues);
    const league = leagues[0];
    const leagueMeta = flattenMeta(league.league[0]);
    return {
      leagueKey: leagueMeta.league_key,
      gameKey: gameMeta.game_key,
      name: leagueMeta.name,
    };
  } catch (err) {
    throw new Error(
      `Couldn't parse Yahoo league discovery response: ${JSON.stringify(json).slice(0, 600)}`
    );
  }
}

export type YahooTeam = { teamKey: string; name: string; isMyTeam: boolean };

export async function getLeagueTeams(leagueKey: string): Promise<YahooTeam[]> {
  const json = await yahooFetch(`league/${leagueKey}/teams`);
  try {
    const teams = collectionValues(json.fantasy_content.league[1].teams);
    return teams.map((t) => {
      const meta = flattenMeta(t.team[0]);
      return {
        teamKey: meta.team_key,
        name: meta.name,
        isMyTeam: !!meta.is_owned_by_current_login,
      };
    });
  } catch (err) {
    throw new Error(
      `Couldn't parse Yahoo teams response: ${JSON.stringify(json).slice(0, 600)}`
    );
  }
}

export async function getTeamRosterPlayerNames(teamKey: string): Promise<string[]> {
  const json = await yahooFetch(`team/${teamKey}/roster`);
  try {
    const playersObj = json.fantasy_content.team[1].roster[0].players;
    const players = collectionValues(playersObj);
    return players.map((p) => {
      const meta = flattenMeta(p.player[0]);
      // name is itself a small object: {full: "...", first: "...", last: "..."}
      return meta.name?.full ?? "";
    }).filter(Boolean);
  } catch (err) {
    throw new Error(
      `Couldn't parse Yahoo roster response for ${teamKey}: ${JSON.stringify(json).slice(0, 600)}`
    );
  }
}

/** Maps a Yahoo team display name to this app's existing (truncated)
 * team-name keys, so live data lines up with everything already built
 * on those keys (League tab, matchup schedule, etc). Falls back to the
 * Yahoo name as-is if it's not in the known mapping (e.g. your own
 * team, or a name that's changed since the schedule was pasted in). */
export function toAppTeamKey(yahooName: string, yourTeamKey: string, isMyTeam: boolean): string {
  if (isMyTeam) return yourTeamKey;
  return YAHOO_NAME_TO_ROSTER_KEY[yahooName] ?? yahooName;
}

/** Fetches every team's live roster for the league, keyed by this app's
 * existing team-name keys. This is the main entry point the rest of the
 * app uses. */
export async function fetchLiveRosters(
  yourTeamKey: string
): Promise<Record<string, { name: string; pos: null; nhl: null; keeper: boolean }[]>> {
  const league = await discoverLeague();
  const teams = await getLeagueTeams(league.leagueKey);

  const result: Record<string, { name: string; pos: null; nhl: null; keeper: boolean }[]> = {};
  await Promise.all(
    teams.map(async (t) => {
      const names = await getTeamRosterPlayerNames(t.teamKey);
      const key = toAppTeamKey(t.name, yourTeamKey, t.isMyTeam);
      result[key] = names.map((name) => ({ name, pos: null, nhl: null, keeper: false }));
    })
  );
  return result;
}
