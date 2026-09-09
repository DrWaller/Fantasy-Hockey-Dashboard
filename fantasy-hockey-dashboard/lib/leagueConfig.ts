// League configuration for Evan's Yahoo H2H Categories keeper league.
// Change these values if league settings are updated season to season.

export const LEAGUE_CONFIG = {
  teams: 12,
  format: "head-to-head-categories" as const,
  keeper: true,

  // Roster construction — used to derive replacement level per position.
  // Counts are PER TEAM (multiply by `teams` for league-wide slot totals).
  roster: {
    C: 2,
    LW: 2,
    RW: 2,
    F: 2, // flex forward slot — fillable by C/LW/RW
    D: 4,
    Util: 1, // fillable by any skater
    G: 3,
    BN: 5, // bench — not used for replacement-level calc, but tracked for context
    IR: 4,
    NA: 1,
  },
};

// Skater categories exactly as configured in Yahoo Scoring & Settings.
export const SKATER_CATEGORIES = [
  { key: "goals", label: "Goals", abbrev: "G", type: "counting", higherIsBetter: true },
  { key: "assists", label: "Assists", abbrev: "A", type: "counting", higherIsBetter: true },
  { key: "ppPoints", label: "Powerplay Points", abbrev: "PPP", type: "counting", higherIsBetter: true },
  { key: "shPoints", label: "Shorthanded Points", abbrev: "SHP", type: "counting", higherIsBetter: true },
  { key: "shots", label: "Shots on Goal", abbrev: "SOG", type: "counting", higherIsBetter: true },
  {
    key: "shootingPct",
    label: "Shooting Percentage",
    abbrev: "SH%",
    type: "rate",
    higherIsBetter: true,
    volumeKey: "shots", // opportunity denominator used to weight this rate stat
  },
  { key: "hits", label: "Hits", abbrev: "HIT", type: "counting", higherIsBetter: true },
  { key: "blockedShots", label: "Blocks", abbrev: "BLK", type: "counting", higherIsBetter: true },
] as const;

// Goalie categories exactly as configured in Yahoo Scoring & Settings.
export const GOALIE_CATEGORIES = [
  { key: "wins", label: "Wins", abbrev: "W", type: "counting", higherIsBetter: true },
  {
    key: "goalsAgainstAverage",
    label: "Goals Against Average",
    abbrev: "GAA",
    type: "rate",
    higherIsBetter: false, // lower is better
    volumeKey: "gamesPlayed",
  },
  {
    key: "savePct",
    label: "Save Percentage",
    abbrev: "SV%",
    type: "rate",
    higherIsBetter: true,
    volumeKey: "shotsAgainst",
  },
  { key: "shutouts", label: "Shutouts", abbrev: "SHO", type: "counting", higherIsBetter: true },
] as const;

export type SkaterCategoryKey = (typeof SKATER_CATEGORIES)[number]["key"];
export type GoalieCategoryKey = (typeof GOALIE_CATEGORIES)[number]["key"];

// League-wide slot totals, derived from roster construction above.
export function leagueWideSlots() {
  const r = LEAGUE_CONFIG.roster;
  const t = LEAGUE_CONFIG.teams;
  return {
    C: r.C * t,
    LW: r.LW * t,
    RW: r.RW * t,
    F_flex: r.F * t,
    D: r.D * t,
    Util: r.Util * t,
    G: r.G * t,
  };
}
