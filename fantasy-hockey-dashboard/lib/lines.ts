// Server-side only. Real NHL line combinations (forward lines, defence pairs
// and power-play units) from Daily Faceoff's team pages, one page per team.
//
// The pages are Next.js sites and ship their data inside the HTML, so this
// finds the list of players that carry a "groupIdentifier" (f1..f4, d1..d3,
// pp1, pp2, pk1, pk2) and reads it. If Daily Faceoff changes the page, a team
// simply comes back empty and the roles route falls back to lines inferred
// from ice time (lib/usage.ts).
import { normalizeName } from "./rosterLookup";

// NHL tri-code -> Daily Faceoff team slug.
const SLUGS: Record<string, string> = {
  ANA: "anaheim-ducks", BOS: "boston-bruins", BUF: "buffalo-sabres", CGY: "calgary-flames", CAR: "carolina-hurricanes",
  CHI: "chicago-blackhawks", COL: "colorado-avalanche", CBJ: "columbus-blue-jackets", DAL: "dallas-stars", DET: "detroit-red-wings",
  EDM: "edmonton-oilers", FLA: "florida-panthers", LAK: "los-angeles-kings", MIN: "minnesota-wild", MTL: "montreal-canadiens",
  NSH: "nashville-predators", NJD: "new-jersey-devils", NYI: "new-york-islanders", NYR: "new-york-rangers", OTT: "ottawa-senators",
  PHI: "philadelphia-flyers", PIT: "pittsburgh-penguins", SJS: "san-jose-sharks", SEA: "seattle-kraken", STL: "st-louis-blues",
  TBL: "tampa-bay-lightning", TOR: "toronto-maple-leafs", UTA: "utah-mammoth", VAN: "vancouver-canucks", VGK: "vegas-golden-knights",
  WSH: "washington-capitals", WPG: "winnipeg-jets",
};
const ALT_SLUGS: Record<string, string[]> = { UTA: ["utah-hockey-club"] };

export interface LinePlayer {
  name: string;
  team: string; // NHL tri-code
  line: string | null;
  pp: "PP1" | "PP2" | null;
}

// From an index inside an array, find the whole array's text.
function enclosingArray(text: string, idx: number): string | null {
  let depth = 0;
  let start = -1;
  for (let i = idx; i >= 0; i--) {
    const c = text[i];
    if (c === "]") depth++;
    else if (c === "[") {
      if (depth === 0) {
        start = i;
        break;
      }
      depth--;
    }
  }
  if (start < 0) return null;
  let d = 0;
  let inStr = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "[") d++;
    else if (c === "]") {
      d--;
      if (d === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function parseLinePlayers(html: string): any[] | null {
  // Next.js can ship the data as plain JSON or as an escaped string inside a script chunk.
  for (const text of [html, html.replace(/\\"/g, '"').replace(/\\\\/g, "\\")]) {
    let from = 0;
    for (let tries = 0; tries < 4; tries++) {
      const idx = text.indexOf('"groupIdentifier"', from);
      if (idx < 0) break;
      from = idx + 20;
      const arr = enclosingArray(text, idx);
      if (!arr) continue;
      try {
        const parsed = JSON.parse(arr);
        if (
          Array.isArray(parsed) &&
          parsed.some((p) => p && typeof p.groupIdentifier === "string" && (p.name || p.playerName))
        )
          return parsed;
      } catch {
        /* try the next occurrence */
      }
    }
  }
  return null;
}

export function toLinePlayers(raw: any[], team: string): LinePlayer[] {
  const by = new Map<string, LinePlayer>();
  for (const p of raw) {
    const name = String(p?.name ?? p?.playerName ?? "").trim();
    const group = String(p?.groupIdentifier ?? "").toLowerCase();
    if (!name || !group) continue;
    const key = normalizeName(name);
    const cur = by.get(key) ?? { name, team, line: null, pp: null };
    let m: RegExpMatchArray | null;
    if ((m = group.match(/^f([1-4])$/))) cur.line = `L${m[1]}`;
    else if ((m = group.match(/^d([1-3])$/))) cur.line = `D${m[1]}`;
    else if ((m = group.match(/^pp([12])$/))) cur.pp = `PP${m[1]}` as "PP1" | "PP2";
    by.set(key, cur);
  }
  return Array.from(by.values());
}

async function fetchTeam(
  abbrev: string
): Promise<{ players: LinePlayer[]; updatedAt: string | null } | null> {
  for (const slug of [SLUGS[abbrev], ...(ALT_SLUGS[abbrev] ?? [])]) {
    try {
      const res = await fetch(`https://www.dailyfaceoff.com/teams/${slug}/line-combinations`, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; FantasyHockeyDashboard/1.0)", accept: "text/html" },
        next: { revalidate: 900 },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const raw = parseLinePlayers(html);
      if (!raw) continue;
      const players = toLinePlayers(raw, abbrev);
      if (players.length === 0) continue;
      const upd = html.match(/"updatedAt":"([^"]+)"/)?.[1] ?? null;
      return { players, updatedAt: upd };
    } catch {
      /* next slug */
    }
  }
  return null;
}

export type LinesResult = {
  players: LinePlayer[];
  teamsOk: string[];
  teamsFailed: string[];
  updatedAt: string | null;
};

export async function getLines(): Promise<LinesResult> {
  const teams = Object.keys(SLUGS);
  const results = await Promise.all(teams.map((t) => fetchTeam(t).then((r) => ({ t, r }))));
  const ok = results.filter((x) => x.r);
  const updated =
    ok
      .map((x) => x.r!.updatedAt)
      .filter((x): x is string => !!x)
      .sort()
      .pop() ?? null;
  return {
    players: ok.flatMap((x) => x.r!.players),
    teamsOk: ok.map((x) => x.t),
    teamsFailed: results.filter((x) => !x.r).map((x) => x.t),
    updatedAt: updated,
  };
}
