// Evan's full 2026-27 season matchup schedule, from Yahoo's team schedule
// page. Static data — re-paste if Yahoo ever restructures weeks (unlikely
// mid-season) or once the real Yahoo API sync makes this unnecessary.
//
// ASSUMPTION WORTH VERIFYING: Week 1 is assumed to start Monday, Sept 28,
// 2026 — the Monday immediately before the NHL's Sept 29 opening night,
// which is Yahoo's standard convention. If Yahoo's own matchup page shows
// a different Week 1 date range, update WEEK1_MONDAY below to match —
// every other week's date range derives from this one anchor.
export const WEEK1_MONDAY = "2026-09-28";

// Maps the opponent names as Yahoo displays them to the (truncated) team
// keys used in lib/rosters.ts, so this data can drive ownership lookups.
const NAME_TO_ROSTER_KEY: Record<string, string> = {
  "UmZy's Team": "UmZy's...",
  "THE GOON SQUAD": "THE GO...",
  "Mark's Team": "Mark's T...",
  "Ice Drop": "Ice Drop",
  "Top Prospect": "Top Pro...",
  "JRoc's Dazzling Team": "JRoc's D...",
  "Mighty pigs": "Mighty...",
  "Charlestown Chiefs": "Charlest...",
  "Kwik-E-Mart Gougers": "Kwik-E-...",
  "Arkham Knights": "Arkham...",
  "Mother Puckers": "Mother...",
};

export type MatchupWeek = {
  week: number;
  opponentDisplayName: string;
  opponentRosterKey: string;
  rivalryWeek: boolean;
};

const RAW_SCHEDULE: [number, string, boolean][] = [
  [1, "UmZy's Team", false],
  [2, "THE GOON SQUAD", false],
  [3, "Mark's Team", false],
  [4, "Ice Drop", false],
  [5, "Top Prospect", false],
  [6, "JRoc's Dazzling Team", true],
  [7, "Top Prospect", false],
  [8, "Mighty pigs", false],
  [9, "Ice Drop", false],
  [10, "Charlestown Chiefs", false],
  [11, "Kwik-E-Mart Gougers", false],
  [12, "JRoc's Dazzling Team", false],
  [13, "Arkham Knights", false],
  [14, "Mark's Team", false],
  [15, "Mother Puckers", true],
  [16, "THE GOON SQUAD", false],
  [17, "UmZy's Team", false],
  [18, "Kwik-E-Mart Gougers", false],
  [19, "Arkham Knights", false],
  [20, "Mighty pigs", false],
  [21, "Charlestown Chiefs", false],
  [22, "Mother Puckers", false],
  [23, "THE GOON SQUAD", true],
];

export const MATCHUP_SCHEDULE: MatchupWeek[] = RAW_SCHEDULE.map(
  ([week, name, rivalry]) => ({
    week,
    opponentDisplayName: name,
    opponentRosterKey: NAME_TO_ROSTER_KEY[name] ?? name,
    rivalryWeek: rivalry,
  })
);

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekDateRange(week: number): { start: string; end: string } {
  const start = addDays(WEEK1_MONDAY, (week - 1) * 7);
  const end = addDays(start, 6);
  return { start, end };
}

/** Which matchup week a given date falls in. Dates before Week 1 clamp
 * forward to Week 1 (a preview of the upcoming week, useful right now
 * before the season's even started); dates after the 23-week matchup
 * schedule return null. */
export function weekNumberForDate(date: Date): number | null {
  const iso = date.toISOString().slice(0, 10);
  const daysSinceStart = Math.floor(
    (new Date(`${iso}T00:00:00`).getTime() - new Date(`${WEEK1_MONDAY}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (daysSinceStart < 0) return 1;
  const week = Math.floor(daysSinceStart / 7) + 1;
  return week <= MATCHUP_SCHEDULE.length ? week : null;
}

export function matchupForWeek(week: number): MatchupWeek | undefined {
  return MATCHUP_SCHEDULE.find((m) => m.week === week);
}
