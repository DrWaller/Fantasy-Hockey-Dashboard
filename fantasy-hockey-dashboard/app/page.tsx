"use client";

import { useEffect, useMemo, useState } from "react";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES } from "@/lib/leagueConfig";

type SkaterRow = {
  playerId: number;
  name: string;
  team: string;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  ppPoints: number;
  shPoints: number;
  shots: number;
  shootingPct: number;
  hits: number;
  blockedShots: number;
  categoryScores: Record<string, number>;
  overallScore: number;
  valueAboveReplacement: number;
  rostered: boolean;
};

type GoalieRow = {
  playerId: number;
  name: string;
  team: string;
  gamesPlayed: number;
  wins: number;
  goalsAgainstAverage: number;
  savePct: number;
  shutouts: number;
  categoryScores: Record<string, number>;
  overallScore: number;
  valueAboveReplacement: number;
  rostered: boolean;
};

function zColor(z: number): string {
  // Maps a z-score to a text color from muted (near 0) to red-hot (strong).
  if (z >= 1.5) return "text-rink-line font-semibold";
  if (z >= 0.75) return "text-rink-gold";
  if (z <= -1) return "text-rink-steel";
  return "text-rink-ice/80";
}

export default function Dashboard() {
  const [tab, setTab] = useState<"skaters" | "goalies">("skaters");
  const [minGames, setMinGames] = useState(3);
  const [showOnly, setShowOnly] = useState<"all" | "targets">("targets");
  const [sortKey, setSortKey] = useState<string>("overallScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [skaters, setSkaters] = useState<SkaterRow[] | null>(null);
  const [goalies, setGoalies] = useState<GoalieRow[] | null>(null);
  const [season, setSeason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/rankings?minGames=${minGames}`).then((r) => r.json()),
      fetch(`/api/goalie-rankings?minGames=${Math.max(1, Math.min(minGames, 3))}`).then((r) =>
        r.json()
      ),
    ])
      .then(([skaterRes, goalieRes]) => {
        if (skaterRes.error) throw new Error(skaterRes.error);
        if (goalieRes.error) throw new Error(goalieRes.error);
        setSkaters(skaterRes.players);
        setGoalies(goalieRes.players);
        setSeason(skaterRes.season);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [minGames]);

  const categories = tab === "skaters" ? SKATER_CATEGORIES : GOALIE_CATEGORIES;
  const rows = tab === "skaters" ? skaters : goalies;

  const sorted = useMemo(() => {
    if (!rows) return [];
    const filtered =
      showOnly === "targets" ? rows.filter((r) => !r.rostered) : rows;
    const withKey = filtered.map((r) => ({
      row: r,
      key:
        sortKey === "overallScore" || sortKey === "valueAboveReplacement"
          ? (r as any)[sortKey]
          : sortKey in r.categoryScores
          ? r.categoryScores[sortKey]
          : (r as any)[sortKey],
    }));
    withKey.sort((a, b) =>
      sortDir === "desc" ? b.key - a.key : a.key - b.key
    );
    return withKey.map((w) => w.row);
  }, [rows, showOnly, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <header className="mb-8 border-b border-rink-steel/40 pb-6">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight text-rink-ice">
          Fantasy Hockey Dashboard
        </h1>
        <p className="mt-1 font-mono text-sm text-rink-ice/60">
          12-team head-to-head categories &middot; keeper &middot; ranked by value above replacement
          {season && <> &middot; {season.slice(0, 4)}-{season.slice(6)} season</>}
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex overflow-hidden rounded border border-rink-steel/50">
          {(["skaters", "goalies"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSortKey("overallScore");
              }}
              className={`px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
                tab === t
                  ? "bg-rink-line text-white"
                  : "bg-transparent text-rink-ice/70 hover:text-rink-ice"
              }`}
            >
              {t === "skaters" ? "Skaters" : "Goalies"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 font-mono text-sm">
          <label htmlFor="minGames" className="text-rink-ice/60">
            Min GP
          </label>
          <input
            id="minGames"
            type="number"
            min={0}
            value={minGames}
            onChange={(e) => setMinGames(Number(e.target.value))}
            className="w-16 rounded border border-rink-steel/50 bg-rink-board px-2 py-1 text-rink-ice"
          />
        </div>

        <div className="flex overflow-hidden rounded border border-rink-steel/50">
          {(["targets", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setShowOnly(s)}
              className={`px-3 py-2 font-mono text-xs uppercase tracking-wide transition-colors ${
                showOnly === s
                  ? "bg-rink-gold text-rink-board"
                  : "bg-transparent text-rink-ice/70 hover:text-rink-ice"
              }`}
              title={
                s === "targets"
                  ? "Players our model doesn't project as typical 12-team starters — likely available or worth pursuing"
                  : "Every eligible player, including likely-rostered starters"
              }
            >
              {s === "targets" ? "Likely targets" : "All players"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="font-mono text-sm text-rink-ice/60">Loading current NHL stats&hellip;</p>
      )}
      {error && (
        <p className="font-mono text-sm text-rink-line">
          Couldn&rsquo;t load NHL data: {error}
        </p>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="overflow-x-auto rounded border border-rink-steel/40">
          <table className="w-full min-w-[900px] border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Player</th>
                {tab === "skaters" && <th className="px-3 py-2">Pos</th>}
                <th className="px-3 py-2">Tm</th>
                <th className="px-3 py-2 text-right">GP</th>
                {categories.map((cat) => (
                  <th
                    key={cat.key}
                    onClick={() => handleSort(cat.key)}
                    className="cursor-pointer px-3 py-2 text-right hover:text-rink-ice"
                    title={cat.label}
                  >
                    {cat.abbrev}
                  </th>
                ))}
                <th
                  onClick={() => handleSort("valueAboveReplacement")}
                  className="cursor-pointer px-3 py-2 text-right text-rink-gold hover:text-rink-ice"
                  title="Value above replacement — overall category value relative to a typical 12-team replacement-level player"
                >
                  VOR
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 150).map((r, i) => (
                <tr
                  key={r.playerId}
                  className="border-b border-rink-steel/10 hover:bg-rink-steel/10"
                >
                  <td className="stat-num px-3 py-1.5 text-rink-ice/40">{i + 1}</td>
                  <td className="px-3 py-1.5 text-rink-ice">{r.name}</td>
                  {tab === "skaters" && (
                    <td className="px-3 py-1.5 text-rink-ice/60">
                      {(r as SkaterRow).position}
                    </td>
                  )}
                  <td className="px-3 py-1.5 text-rink-ice/60">{r.team}</td>
                  <td className="stat-num px-3 py-1.5 text-right text-rink-ice/60">
                    {r.gamesPlayed}
                  </td>
                  {categories.map((cat) => {
                    const raw =
                      cat.key === "shootingPct" || cat.key === "savePct"
                        ? (((r as any)[cat.key] as number) * 100).toFixed(1)
                        : cat.key === "goalsAgainstAverage"
                        ? ((r as any)[cat.key] as number).toFixed(2)
                        : (r as any)[cat.key];
                    return (
                      <td
                        key={cat.key}
                        className={`stat-num px-3 py-1.5 text-right ${zColor(
                          r.categoryScores[cat.key]
                        )}`}
                      >
                        {raw}
                      </td>
                    );
                  })}
                  <td className="stat-num px-3 py-1.5 text-right font-semibold text-rink-gold">
                    {r.valueAboveReplacement.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <p className="font-mono text-sm text-rink-ice/60">
          No players match the current filters.
        </p>
      )}

      <footer className="mt-8 font-mono text-xs text-rink-ice/40">
        Data: NHL stats API. &ldquo;Likely targets&rdquo; is model-estimated (not synced to your
        actual Yahoo league rosters yet) &mdash; cross-check against your league&rsquo;s free
        agent list.
      </footer>
    </main>
  );
}
