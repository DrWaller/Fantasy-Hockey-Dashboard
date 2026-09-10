"use client";

import { useEffect, useMemo, useState } from "react";
import { SKATER_CATEGORIES, GOALIE_CATEGORIES } from "@/lib/leagueConfig";
import {
  scoreSkaters,
  scoreGoalies,
  estimateReplacementLevel,
  estimateGoalieReplacementLevel,
} from "@/lib/scoring";
import ScheduleView from "@/components/ScheduleView";
import ZeroGView from "@/components/ZeroGView";

type RawSkater = {
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
};

type RawGoalie = {
  playerId: number;
  name: string;
  team: string;
  gamesPlayed: number;
  wins: number;
  goalsAgainstAverage: number;
  savePct: number;
  shutouts: number;
};

const ALL_CATEGORY_KEYS = [
  ...SKATER_CATEGORIES.map((c) => c.key),
  ...GOALIE_CATEGORIES.map((c) => c.key),
];

function defaultWeights(): Record<string, number> {
  return Object.fromEntries(ALL_CATEGORY_KEYS.map((k) => [k, 1]));
}

function zColor(z: number): string {
  if (z >= 1.5) return "text-rink-line font-semibold";
  if (z >= 0.75) return "text-rink-gold";
  if (z <= -1) return "text-rink-steel";
  return "text-rink-ice/80";
}

export default function Dashboard() {
  const [tab, setTab] = useState<"skaters" | "goalies" | "schedule" | "zerog">("skaters");
  const [minGames, setMinGames] = useState(3);
  const [showOnly, setShowOnly] = useState<"all" | "targets">("targets");
  const [sortKey, setSortKey] = useState<string>("valueAboveReplacement");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [weights, setWeights] = useState<Record<string, number>>(defaultWeights());
  const [weightsOpen, setWeightsOpen] = useState(false);
  // Manual per-player VOR nudges — the in-season equivalent of a scouting
  // "boost/bust" call. Session-only for now (resets on page reload); ask
  // for persistent storage if this proves worth keeping across visits.
  const [overrides, setOverrides] = useState<Record<number, number>>({});

  const [rawSkaters, setRawSkaters] = useState<RawSkater[] | null>(null);
  const [rawGoalies, setRawGoalies] = useState<RawGoalie[] | null>(null);
  const [season, setSeason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [scheduleData, setScheduleData] = useState<any>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [zeroGData, setZeroGData] = useState<any>(null);
  const [zeroGError, setZeroGError] = useState<string | null>(null);
  const [zeroGLoading, setZeroGLoading] = useState(false);

  // Schedule barely changes day to day, so fetch it once, lazily, the
  // first time the Schedule tab is opened rather than on every load.
  useEffect(() => {
    if (tab !== "schedule" || scheduleData || scheduleLoading) return;
    setScheduleLoading(true);
    setScheduleError(null);
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setScheduleData(res);
      })
      .catch((e) => setScheduleError(e.message))
      .finally(() => setScheduleLoading(false));
  }, [tab, scheduleData, scheduleLoading]);

  // Zero-G targets — lazy, one-time fetch per visit to the tab. This
  // endpoint does real work server-side (scans recent boxscores across
  // the league), so it's cached 12h server-side and not refetched here
  // on every tab switch within a session.
  useEffect(() => {
    if (tab !== "zerog" || zeroGData || zeroGLoading) return;
    setZeroGLoading(true);
    setZeroGError(null);
    fetch("/api/zero-g")
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setZeroGData(res);
      })
      .catch((e) => setZeroGError(e.message))
      .finally(() => setZeroGLoading(false));
  }, [tab, zeroGData, zeroGLoading]);

  // Only refetches from the NHL API when minGames changes — weight-slider
  // tweaks are re-scored entirely client-side, no network round trip.
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
        setRawSkaters(skaterRes.players);
        setRawGoalies(goalieRes.players);
        setSeason(skaterRes.season);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [minGames]);

  const scoredSkaters = useMemo(() => {
    if (!rawSkaters) return null;
    const scored = scoreSkaters(rawSkaters, weights);
    const { replacementScore, replacementPlayer, rosteredPlayerIds } =
      estimateReplacementLevel(scored as any);
    return scored
      .map((p) => {
        const adj = overrides[(p as any).playerId] ?? 0;
        return {
          ...p,
          rostered: rosteredPlayerIds.has((p as any).playerId),
          manualAdjustment: adj,
          valueAboveReplacement: p.overallScore - replacementScore + adj,
          replacementPlayerName: (replacementPlayer as any)?.name ?? null,
        };
      })
      .sort((a, b) => b.valueAboveReplacement - a.valueAboveReplacement);
  }, [rawSkaters, weights, overrides]);

  const scoredGoalies = useMemo(() => {
    if (!rawGoalies) return null;
    const scored = scoreGoalies(rawGoalies, weights);
    const { replacementScore, replacementPlayer, rosteredPlayerIds } =
      estimateGoalieReplacementLevel(scored as any);
    return scored
      .map((g) => {
        const adj = overrides[(g as any).playerId] ?? 0;
        return {
          ...g,
          rostered: rosteredPlayerIds.has((g as any).playerId),
          manualAdjustment: adj,
          valueAboveReplacement: g.overallScore - replacementScore + adj,
          replacementPlayerName: (replacementPlayer as any)?.name ?? null,
        };
      })
      .sort((a, b) => b.valueAboveReplacement - a.valueAboveReplacement);
  }, [rawGoalies, weights, overrides]);

  function setOverride(playerId: number, value: number) {
    setOverrides((o) => {
      const next = { ...o };
      if (value === 0) delete next[playerId];
      else next[playerId] = value;
      return next;
    });
  }

  const categories = tab === "skaters" ? SKATER_CATEGORIES : GOALIE_CATEGORIES;
  const rows = tab === "skaters" ? scoredSkaters : scoredGoalies;

  const sorted = useMemo(() => {
    if (!rows) return [];
    const filtered =
      showOnly === "targets" ? rows.filter((r: any) => !r.rostered) : rows;
    const withKey = filtered.map((r: any) => ({
      row: r,
      key:
        sortKey === "overallScore" || sortKey === "valueAboveReplacement"
          ? r[sortKey]
          : sortKey in r.categoryScores
          ? r.categoryScores[sortKey]
          : r[sortKey],
    }));
    withKey.sort((a, b) => (sortDir === "desc" ? b.key - a.key : a.key - b.key));
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

  function setWeight(key: string, value: number) {
    setWeights((w) => ({ ...w, [key]: value }));
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <header className="mb-8 flex items-center gap-5 border-b border-rink-line/30 pb-6">
        <img
          src="/logo.png"
          alt="The Dark Seider"
          className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(200,16,46,0.35)]"
        />
        <div>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide text-rink-ice">
            Fantasy Hockey Dashboard
          </h1>
          <p className="mt-1 font-mono text-sm text-rink-ice/60">
            12-team head-to-head categories &middot; keeper &middot; ranked by value above replacement
            {season && <> &middot; {season.slice(0, 4)}-{season.slice(6)} season</>}
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex overflow-hidden rounded border border-rink-steel/50">
          {(["skaters", "goalies", "schedule", "zerog"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t !== "schedule" && t !== "zerog") setSortKey("valueAboveReplacement");
              }}
              className={`px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
                tab === t
                  ? "bg-rink-line text-white"
                  : "bg-transparent text-rink-ice/70 hover:text-rink-ice"
              }`}
            >
              {t === "skaters"
                ? "Skaters"
                : t === "goalies"
                ? "Goalies"
                : t === "schedule"
                ? "Schedule"
                : "Zero-G"}
            </button>
          ))}
        </div>

        {tab !== "schedule" && tab !== "zerog" && (
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
        )}

        {tab !== "schedule" && tab !== "zerog" && (
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
        )}

        {tab !== "schedule" && tab !== "zerog" && (
          <button
            onClick={() => setWeightsOpen((o) => !o)}
            className="rounded border border-rink-steel/50 px-3 py-2 font-mono text-xs uppercase tracking-wide text-rink-ice/70 hover:text-rink-ice"
          >
            {weightsOpen ? "Hide" : "Category weights"}
          </button>
        )}
      </div>

      {tab !== "schedule" && tab !== "zerog" && weightsOpen && (
        <div className="mb-6 rounded border border-rink-steel/40 bg-rink-steel/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-wide text-rink-ice/50">
              Category weight &mdash; 0 ignores it, 1 is equal weight, 2 doubles it
            </p>
            <button
              onClick={() => setWeights(defaultWeights())}
              className="font-mono text-xs text-rink-gold hover:underline"
            >
              Reset to equal
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {categories.map((cat) => (
              <div key={cat.key} className="flex flex-col gap-1">
                <label className="flex justify-between font-mono text-xs text-rink-ice/70">
                  <span>{cat.abbrev}</span>
                  <span className="stat-num text-rink-gold">
                    {weights[cat.key].toFixed(2)}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.25}
                  value={weights[cat.key]}
                  onChange={(e) => setWeight(cat.key, Number(e.target.value))}
                  className="accent-rink-line"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <>
          {scheduleLoading && (
            <p className="font-mono text-sm text-rink-ice/60">
              Loading NHL schedule&hellip; (32 team calls, first load only)
            </p>
          )}
          {scheduleError && (
            <p className="font-mono text-sm text-rink-line">
              Couldn&rsquo;t load schedule: {scheduleError}
            </p>
          )}
          {!scheduleLoading && !scheduleError && scheduleData && (
            <ScheduleView data={scheduleData} />
          )}
        </>
      )}

      {tab === "zerog" && (
        <>
          {zeroGLoading && (
            <p className="font-mono text-sm text-rink-ice/60">
              Scanning recent boxscores league-wide&hellip; this one&rsquo;s heavier than
              the other tabs, first load only.
            </p>
          )}
          {zeroGError && (
            <p className="font-mono text-sm text-rink-line">
              Couldn&rsquo;t load Zero-G targets: {zeroGError}
            </p>
          )}
          {!zeroGLoading && !zeroGError && zeroGData && (
            <ZeroGView candidates={zeroGData.candidates} lastN={zeroGData.lastN} />
          )}
        </>
      )}

      {tab !== "schedule" && tab !== "zerog" && loading && (
        <p className="font-mono text-sm text-rink-ice/60">Loading current NHL stats&hellip;</p>
      )}
      {tab !== "schedule" && tab !== "zerog" && error && (
        <p className="font-mono text-sm text-rink-line">
          Couldn&rsquo;t load NHL data: {error}
        </p>
      )}

      {tab !== "schedule" && tab !== "zerog" && !loading && !error && sorted.length > 0 && (
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
                  title="Value above replacement — overall category value relative to a typical 12-team replacement-level player, using your current category weights and any manual adjustment below"
                >
                  VOR
                </th>
                <th
                  className="px-3 py-2 text-right text-rink-ice/50"
                  title="Manual adjustment — your own nudge to this player's VOR, e.g. a role change or news the raw stats haven't caught up to yet. Added directly to VOR. Resets on page reload."
                >
                  Adj
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 150).map((r: any, i: number) => (
                <tr
                  key={r.playerId}
                  className="border-b border-rink-steel/10 hover:bg-rink-steel/10"
                >
                  <td className="stat-num px-3 py-1.5 text-rink-ice/40">{i + 1}</td>
                  <td className="px-3 py-1.5 text-rink-ice">{r.name}</td>
                  {tab === "skaters" && (
                    <td className="px-3 py-1.5 text-rink-ice/60">{r.position}</td>
                  )}
                  <td className="px-3 py-1.5 text-rink-ice/60">{r.team}</td>
                  <td className="stat-num px-3 py-1.5 text-right text-rink-ice/60">
                    {r.gamesPlayed}
                  </td>
                  {categories.map((cat) => {
                    const raw =
                      cat.key === "shootingPct" || cat.key === "savePct"
                        ? ((r[cat.key] as number) * 100).toFixed(1)
                        : cat.key === "goalsAgainstAverage"
                        ? (r[cat.key] as number).toFixed(2)
                        : r[cat.key];
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
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      step={0.5}
                      value={r.manualAdjustment || ""}
                      placeholder="0"
                      onChange={(e) =>
                        setOverride(r.playerId, Number(e.target.value) || 0)
                      }
                      className="w-14 rounded border border-rink-steel/40 bg-rink-board px-1 py-0.5 text-right text-rink-ice/80 stat-num"
                      title="Manual VOR adjustment for this player"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted[0]?.replacementPlayerName && (
            <p className="border-t border-rink-steel/40 px-3 py-2 font-mono text-xs text-rink-ice/40">
              The last player this model fills a 12-team roster with is{" "}
              <span className="text-rink-ice/70">
                {sorted[0].replacementPlayerName}
              </span>{" "}
              — that sets VOR&rsquo;s zero line. Everyone below is treated as
              a typical bench/streaming-tier player.
            </p>
          )}
        </div>
      )}

      {tab !== "schedule" && tab !== "zerog" && !loading && !error && sorted.length === 0 && (
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
