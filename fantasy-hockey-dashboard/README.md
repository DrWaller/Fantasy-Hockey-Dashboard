# Fantasy Hockey Targets

A category-value targeting dashboard for a 12-team Yahoo H2H Categories keeper
league. Pulls live stats from the NHL's public stats API server-side, scores
every skater and goalie against your league's actual categories and roster
construction, and ranks players by value above a realistic replacement level.

## League this was built for

- Yahoo Fantasy Hockey, Head-to-Head Categories, 12 teams, keeper
- Roster: C, C, LW, LW, RW, RW, F, F, D, D, D, D, Util, G, G, G (+ bench/IR)
- Skater categories: G, A, PPP, SHP, SOG, SH%, HIT, BLK
- Goalie categories: W, GAA, SV%, SHO

If any of this changes, edit `lib/leagueConfig.ts` — everything else
(replacement level, category weighting, the UI) derives from that file.

## How the scoring works

- **Counting stats** (G, A, PPP, SHP, SOG, HIT, BLK, W, SHO) are z-scored
  against the eligible player pool.
- **Rate stats** (SH%, SV%, GAA) are volume-weighted before z-scoring, so a
  goalie's .930 SV% on 40 shots doesn't outrank .920 on 900 shots — the
  standard fix for the "small sample rate stat" problem in categories leagues.
- **Replacement level** is estimated by greedily filling your league's actual
  roster slots (dedicated position slots, then flex, then utility) across all
  12 teams with the highest-value players, position by position. The last
  player who fits is the replacement-level baseline. Everyone below that line
  is flagged as a "likely target" in the UI.

## Known limitation (v1)

This does **not** know who's actually rostered in your specific Yahoo league
— that requires Yahoo's Fantasy Sports API with OAuth login, which is a
separate integration. Right now, "Likely targets" is a model estimate based
on league-wide replacement level, not a live sync against your league's free
agent list. Cross-check picks against Yahoo before adding.

**Phase 2 idea:** wire up Yahoo Fantasy API OAuth so the dashboard can pull
your actual roster + true free-agent list, and layer in weekly schedule data
(games-this-week) for streaming recommendations. Flag this to Claude in a
future session if you want to build it.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploying to Vercel

Same pattern as your other dashboards:

1. Push this folder to a GitHub repo.
2. Import it into Vercel (vercel.com/new).
3. No environment variables are required for v1 — the NHL API calls happen
   server-side in the API routes and need no key.
4. Deploy. Vercel's network isn't restricted the way this build sandbox was,
   so the Google Fonts (Oswald / IBM Plex Mono) will resolve fine there.

## Project structure

```
app/
  page.tsx                    dashboard UI (tabs, sortable table, filters)
  api/rankings/route.ts       server-side skater rankings endpoint
  api/goalie-rankings/route.ts server-side goalie rankings endpoint
lib/
  leagueConfig.ts              your league's categories + roster construction
  nhlApi.ts                    NHL stats API client (server-only)
  scoring.ts                   z-score / VOR scoring engine
```
