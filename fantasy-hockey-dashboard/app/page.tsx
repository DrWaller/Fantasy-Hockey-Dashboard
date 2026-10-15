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
import LeagueView from "@/components/LeagueView";
import OptimizerView from "@/components/OptimizerView";
import YahooConnectBanner from "@/components/YahooConnectBanner";
import WeekStrategyView from "@/components/WeekStrategyView";
import RadarView from "@/components/RadarView";
import TableFilters from "@/components/TableFilters";
import {
  DEFAULT_FILTERS,
  TIER_STYLE,
  computeTiers,
  computeBlendedTiers,
  vorPercentiles,
  isGoodPlus,
  latestTeam,
  passesFilters,
  starterCount,
  type Filters,
  type Period,
} from "@/lib/tableFilters";
import { lookupRole, type RolesPayload } from "@/lib/roles";
import type { InjuriesPayload } from "@/lib/injuries";
import { previousSeasonId } from "@/lib/nhlApi";
import { allTeamNames, normalizeName } from "@/lib/rosterLookup";
import { buildEffectiveOwnership, effectiveOwner, YOUR_TEAM } from "@/lib/effectiveRoster";

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
  const [tab, setTab] = useState<
    "skaters" | "goalies" | "schedule" | "zerog" | "league" | "optimizer" | "week" | "radar"
  >("skaters");
  const isTableTab = tab === "skaters" || tab === "goalies";
  const [minGames, setMinGames] = useState(3);
  const [showOnly, setShowOnly] = useState<"all" | "targets">("targets");
  const [sortKey, setSortKey] = useState<string>("valueAboveReplacement");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [weights, setWeights] = useState<Record<string, number>>(defaultWeights());
  const [weightsOpen, setWeightsOpen] = useState(false);
  // Best-Available-style controls: date window, filters and role search.
  const [period, setPeriod] = useState<Period>("season");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [seasonFallback, setSeasonFallback] = useState(false);
  const [rolesData, setRolesData] = useState<RolesPayload | null>(null);
  const [rolesRequested, setRolesRequested] = useState(false);
  const [injuriesData, setInjuriesData] = useState<InjuriesPayload | null>(null);
  const [injuriesRequested, setInjuriesRequested] = useState(false);
  // Last season's full-season stats, used to temper the tier and to flag
  // players who were Good+ last year.
  const [lyWeight, setLyWeight] = useState(0.4);
  const [lyRaw, setLyRaw] = useState<{ skaters: any[]; goalies: any[] } | null>(null);
  const [lyRequested, setLyRequested] = useState(false);
  const [lyFailed, setLyFailed] = useState(false);
  // Manual per-player VOR nudges — the in-season equivalent of a scouting
  // "boost/bust" call. Session-only for now (resets on page reload); ask
  // for persistent storage if this proves worth keeping across visits.
  const [overrides, setOverrides] = useState<Record<number, number>>({});

  // Live add/drop overlay on top of the roster baseline — persisted
  // server-side (Redis), synced across devices. Fetched once on mount
  // since it affects the Owner column shown by default.
  const [rosterOverrides, setRosterOverrides] = useState<Record<string, any>>({});
  const [rosterSaveError, setRosterSaveError] = useState<string | null>(null);

  // The baseline itself: live Yahoo rosters when connected, otherwise
  // null (meaning "use the bundled static snapshot").
  const [rosterBaseline, setRosterBaseline] = useState<Record<string, any> | null>(null);
  const [yahooConnected, setYahooConnected] = useState(false);
  const [yahooSyncedAt, setYahooSyncedAt] = useState<string | null>(null);
  const [yahooStatusMessage, setYahooStatusMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  function refreshRosterBaseline() {
    fetch("/api/roster-baseline")
      .then((r) => r.json())
      .then((res) => {
        setRosterBaseline(res.baseline ?? null);
        setYahooSyncedAt(res.syncedAt ?? null);
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetch("/api/roster")
      .then((r) => r.json())
      .then((res) => {
        if (res.overrides) setRosterOverrides(res.overrides);
      })
      .catch(() => {
        // Non-fatal — dashboard still works from the static baseline.
      });

    fetch("/api/yahoo/status")
      .then((r) => r.json())
      .then((res) => {
        setYahooConnected(!!res.connected);
        setYahooSyncedAt(res.syncedAt ?? null);
      })
      .catch(() => {});

    refreshRosterBaseline();

    // One-time status message from the OAuth callback redirect, if any.
    const params = new URLSearchParams(window.location.search);
    if (params.has("yahoo_connected")) {
      const syncErr = params.get("yahoo_sync_error");
      setYahooStatusMessage(
        syncErr
          ? { type: "error", text: `Connected, but initial sync failed: ${syncErr}` }
          : { type: "success", text: "Connected to Yahoo and synced." }
      );
    } else if (params.has("yahoo_error")) {
      setYahooStatusMessage({ type: "error", text: params.get("yahoo_error") ?? "Yahoo connection failed" });
    }
    if (params.has("yahoo_connected") || params.has("yahoo_error")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const ownership = useMemo(
    () => buildEffectiveOwnership(rosterOverrides as any, rosterBaseline ? (rosterBaseline as any) : undefined),
    [rosterOverrides, rosterBaseline]
  );

  async function handleOwnerChange(playerName: string, team: string | null) {
    setRosterSaveError(null);
    const key = normalizeName(playerName);
    // Optimistic update so the dropdown feels instant.
    setRosterOverrides((prev) => ({
      ...prev,
      [key]: { playerName, team, updatedAt: new Date().toISOString() },
    }));
    try {
      const res = await fetch("/api/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: playerName, team }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRosterOverrides(json.overrides);
    } catch (e: any) {
      setRosterSaveError(e.message ?? "Failed to save roster change");
      // Re-sync from server so the UI doesn't drift from reality on failure.
      fetch("/api/roster")
        .then((r) => r.json())
        .then((res) => res.overrides && setRosterOverrides(res.overrides))
        .catch(() => {});
    }
  }

  async function handleResetAllEdits() {
    if (
      !window.confirm(
        "Clear every add/drop edit made with the Owner dropdown? Rosters will go back to the imported baseline."
      )
    )
      return;
    setRosterSaveError(null);
    try {
      const res = await fetch("/api/roster?all=1", { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRosterOverrides(json.overrides ?? {});
    } catch (e: any) {
      setRosterSaveError(e.message ?? "Failed to reset roster edits");
    }
  }

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

  const [leagueSkaters, setLeagueSkaters] = useState<any[] | null>(null);
  const [leagueGoalies, setLeagueGoalies] = useState<any[] | null>(null);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(false);

  // League tab needs every rostered player regardless of games played
  // (minGames=0), independent of the Min GP control used elsewhere.
  useEffect(() => {
    if (
      (tab !== "league" && tab !== "optimizer" && tab !== "week" && tab !== "radar") ||
      leagueSkaters ||
      leagueLoading
    )
      return;
    setLeagueLoading(true);
    setLeagueError(null);
    Promise.all([
      fetch(`/api/rankings?minGames=0`).then((r) => r.json()),
      fetch(`/api/goalie-rankings?minGames=0`).then((r) => r.json()),
    ])
      .then(([skaterRes, goalieRes]) => {
        if (skaterRes.error) throw new Error(skaterRes.error);
        if (goalieRes.error) throw new Error(goalieRes.error);
        setLeagueSkaters(skaterRes.players);
        setLeagueGoalies(goalieRes.players);
      })
      .catch((e) => setLeagueError(e.message))
      .finally(() => setLeagueLoading(false));
  }, [tab, leagueSkaters, leagueLoading]);

  // Schedule barely changes day to day, so fetch it once, lazily, the
  // first time the Schedule tab is opened rather than on every load.
  useEffect(() => {
    if (
      (tab !== "schedule" && tab !== "optimizer" && !isTableTab) ||
      scheduleData ||
      scheduleLoading
    )
      return;
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
  }, [tab, isTableTab, scheduleData, scheduleLoading]);

  // Line combinations (Daily Faceoff, ice-time fallback) and the injury
  // report: fetched once, lazily, the first time a table tab opens. Both
  // endpoints always answer 200 and report failure in the body, so a dead
  // source just switches its controls off.
  useEffect(() => {
    if (!isTableTab) return;
    if (!rolesRequested) {
      setRolesRequested(true);
      fetch("/api/roles")
        .then((r) => r.json())
        .then(setRolesData)
        .catch(() => setRolesData({ ok: false, roles: {}, teamsOk: [], teamsFailed: [], inferredFrom: false, updatedAt: null }));
    }
    if (!injuriesRequested) {
      setInjuriesRequested(true);
      fetch("/api/injuries")
        .then((r) => r.json())
        .then(setInjuriesData)
        .catch(() => setInjuriesData({ ok: false, injuries: {} }));
    }
  }, [isTableTab, rolesRequested, injuriesRequested]);

  // Last season, fetched once. Minimum games keep tiny samples (a 3-game
  // call-up) from ranking as last year's stars.
  useEffect(() => {
    if (!isTableTab || lyRequested) return;
    setLyRequested(true);
    const prev = previousSeasonId();
    Promise.all([
      fetch(`/api/rankings?season=${prev}&minGames=20`).then((r) => r.json()),
      fetch(`/api/goalie-rankings?season=${prev}&minGames=10`).then((r) => r.json()),
    ])
      .then(([sk, go]) => {
        if (sk.error || go.error) throw new Error(sk.error || go.error);
        setLyRaw({ skaters: sk.players, goalies: go.players });
      })
      .catch(() => setLyFailed(true));
  }, [isTableTab, lyRequested]);

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

  // Only refetches from the NHL API when minGames or the period changes —
  // weight-slider tweaks are re-scored entirely client-side, no network
  // round trip.
  useEffect(() => {
    setLoading(true);
    setError(null);
    const days = period === "l7" ? 7 : period === "l15" ? 15 : period === "l30" ? 30 : 0;
    const daysQ = days ? `&days=${days}` : "";
    Promise.all([
      fetch(`/api/rankings?minGames=${minGames}${daysQ}`).then((r) => r.json()),
      fetch(
        `/api/goalie-rankings?minGames=${Math.max(1, Math.min(minGames, 3))}${daysQ}`
      ).then((r) => r.json()),
    ])
      .then(([skaterRes, goalieRes]) => {
        if (skaterRes.error) throw new Error(skaterRes.error);
        if (goalieRes.error) throw new Error(goalieRes.error);
        setRawSkaters(skaterRes.players);
        setRawGoalies(goalieRes.players);
        setSeason(skaterRes.season);
        setSeasonFallback(!!skaterRes.fallback);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [minGames, period]);

  const scoredSkaters = useMemo(() => {
    if (!rawSkaters) return null;
    const scored = scoreSkaters(rawSkaters, weights);
    const { replacementScore, replacementPlayer } = estimateReplacementLevel(scored as any);
    return scored
      .map((p) => {
        const adj = overrides[(p as any).playerId] ?? 0;
        const owner = effectiveOwner((p as any).name, ownership);
        return {
          ...p,
          owner,
          rostered: owner !== null, // real roster data, not model-estimated
          manualAdjustment: adj,
          valueAboveReplacement: p.overallScore - replacementScore + adj,
          vorPerGame:
            (p.overallScore - replacementScore + adj) /
            Math.max(1, Number((p as any).gamesPlayed) || 0),
          replacementPlayerName: (replacementPlayer as any)?.name ?? null,
        };
      })
      .sort((a, b) => b.valueAboveReplacement - a.valueAboveReplacement);
  }, [rawSkaters, weights, overrides, ownership]);

  const scoredGoalies = useMemo(() => {
    if (!rawGoalies) return null;
    const scored = scoreGoalies(rawGoalies, weights);
    const { replacementScore, replacementPlayer } = estimateGoalieReplacementLevel(
      scored as any
    );
    return scored
      .map((g) => {
        const adj = overrides[(g as any).playerId] ?? 0;
        const owner = effectiveOwner((g as any).name, ownership);
        return {
          ...g,
          owner,
          rostered: owner !== null, // real roster data, not model-estimated
          manualAdjustment: adj,
          valueAboveReplacement: g.overallScore - replacementScore + adj,
          vorPerGame:
            (g.overallScore - replacementScore + adj) /
            Math.max(1, Number((g as any).gamesPlayed) || 0),
          replacementPlayerName: (replacementPlayer as any)?.name ?? null,
        };
      })
      .sort((a, b) => b.valueAboveReplacement - a.valueAboveReplacement);
  }, [rawGoalies, weights, overrides, ownership]);

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

  // Schedule lookup for the Plays-on filter and the next-7-days games column.
  const scheduleByTri = useMemo(() => {
    const m = new Map<string, { playsOn: Record<string, boolean>; games: number }>();
    for (const r of scheduleData?.grid?.rows ?? []) {
      m.set(r.team, { playsOn: r.playsOn, games: r.gamesThisWeek });
    }
    return m;
  }, [scheduleData]);
  const scheduleForFilter = useMemo(() => {
    if (scheduleByTri.size === 0) return null;
    return new Map(Array.from(scheduleByTri.entries()).map(([k, v]) => [k, v.playsOn] as const));
  }, [scheduleByTri]);

  const rolesState: "loading" | "ok" | "unavailable" = !rolesData
    ? "loading"
    : rolesData.ok
    ? "ok"
    : "unavailable";
  const injuriesState: "loading" | "ok" | "unavailable" = !injuriesData
    ? "loading"
    : injuriesData.ok
    ? "ok"
    : "unavailable";

  // Adds the derived fields the filters and extra columns need: current NHL
  // team, tier (by VOR rank in the current pool), role, injury, games ahead.
  // Last season scored the same way as this season (same category weights),
  // giving each player's last-year VOR percentile and pure last-year tier.
  // Skipped when the table is already showing last season's stats.
  const lyScored = useMemo(() => {
    if (!lyRaw || seasonFallback) return null;
    const isSk = tab === "skaters";
    const scored: any[] = isSk ? scoreSkaters(lyRaw.skaters, weights) : scoreGoalies(lyRaw.goalies, weights);
    if (scored.length === 0) return null;
    const { replacementScore } = isSk
      ? estimateReplacementLevel(scored as any)
      : estimateGoalieReplacementLevel(scored as any);
    const vorRows = scored.map((p) => ({
      playerId: p.playerId as number,
      valueAboveReplacement: p.overallScore - replacementScore,
    }));
    return {
      pct: vorPercentiles(vorRows),
      tiers: computeTiers(vorRows, starterCount(isSk ? "skaters" : "goalies")),
    };
  }, [lyRaw, seasonFallback, tab, weights]);

  const lyState: "loading" | "ok" | "unavailable" | "off" = seasonFallback
    ? "off"
    : lyScored
    ? "ok"
    : lyFailed
    ? "unavailable"
    : "loading";

  const decorated = useMemo(() => {
    if (!rows) return [];
    const kind = tab === "skaters" ? "skaters" : "goalies";
    const tiers = computeBlendedTiers(
      rows as any,
      lyScored?.pct ?? null,
      lyWeight,
      starterCount(kind)
    );
    return rows.map((r: any) => {
      const tri = latestTeam(r.team);
      return {
        ...r,
        tri,
        tier: tiers.get(r.playerId) ?? "Replacement",
        lyTier: lyScored?.tiers.get(r.playerId) ?? null,
        role: kind === "skaters" ? lookupRole(rolesData?.roles, tri, r.name) : null,
        injury: injuriesData?.injuries?.[normalizeName(r.name)] ?? null,
        games7: scheduleByTri.get(tri)?.games ?? null,
      };
    });
  }, [rows, tab, rolesData, injuriesData, scheduleByTri, lyScored, lyWeight]);

  const teamOptions = useMemo(
    () => Array.from(new Set(decorated.map((r: any) => r.tri).filter(Boolean))).sort() as string[],
    [decorated]
  );

  const sorted = useMemo(() => {
    const kind = tab === "skaters" ? "skaters" : "goalies";
    const ctx = {
      kind,
      schedule: scheduleForFilter,
      rolesAvailable: rolesState === "ok",
      injuriesAvailable: injuriesState === "ok",
    } as const;
    const filtered = decorated
      .filter((r: any) => (showOnly === "targets" ? !r.rostered : true))
      .filter((r: any) => passesFilters(r, filters, ctx));
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
    const ordered = withKey.map((w) => w.row);
    if (filters.pinLY && lyScored) {
      // Stable partition: last year's Good+ first, each group keeps its sort.
      return [
        ...ordered.filter((r: any) => isGoodPlus(r.lyTier)),
        ...ordered.filter((r: any) => !isGoodPlus(r.lyTier)),
      ];
    }
    return ordered;
  }, [decorated, tab, showOnly, filters, sortKey, sortDir, scheduleForFilter, rolesState, injuriesState, lyScored]);

  // Players who were Good+ last season and still match the current filters
  // (with "Free agents" on, that's the ones you can actually pick up).
  const lyGoodPlus = useMemo(
    () =>
      sorted
        .filter((r: any) => isGoodPlus(r.lyTier))
        .sort((a: any, b: any) => (lyScored?.pct.get(b.playerId) ?? 0) - (lyScored?.pct.get(a.playerId) ?? 0)),
    [sorted, lyScored]
  );

  const poolSize = useMemo(
    () => (showOnly === "targets" ? decorated.filter((r: any) => !r.rostered).length : decorated.length),
    [decorated, showOnly]
  );

  function handleSortPreset(key: "valueAboveReplacement" | "vorPerGame") {
    setSortKey(key);
    setSortDir("desc");
  }

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
            {period !== "season" && <> &middot; last {period.slice(1)} days</>}
          </p>
        </div>
      </header>

      <YahooConnectBanner
        connected={yahooConnected}
        syncedAt={yahooSyncedAt}
        statusMessage={yahooStatusMessage}
        onSyncComplete={() => {
          refreshRosterBaseline();
          setYahooConnected(true);
        }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex w-full overflow-x-auto rounded border border-rink-steel/50 sm:w-auto">
          {(
            ["skaters", "goalies", "schedule", "zerog", "league", "optimizer", "week", "radar"] as const
          ).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === "skaters" || t === "goalies") setSortKey("valueAboveReplacement");
              }}
              className={`shrink-0 whitespace-nowrap px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
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
                : t === "zerog"
                ? "Zero-G"
                : t === "league"
                ? "League"
                : t === "optimizer"
                ? "Optimizer"
                : t === "radar"
                ? "Radar"
                : "Week"}
            </button>
          ))}
        </div>

        {isTableTab && (
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

        {isTableTab && (
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
                    ? "True free agents per your last roster import — not currently rostered by any of the 12 teams"
                    : "Every eligible player, rostered or not"
                }
              >
                {s === "targets" ? "Free agents" : "All players"}
              </button>
            ))}
          </div>
        )}

        {isTableTab && (
          <button
            onClick={() => setWeightsOpen((o) => !o)}
            className="rounded border border-rink-steel/50 px-3 py-2 font-mono text-xs uppercase tracking-wide text-rink-ice/70 hover:text-rink-ice"
          >
            {weightsOpen ? "Hide" : "Category weights"}
          </button>
        )}
      </div>

      {isTableTab && weightsOpen && (
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

      {isTableTab && (
        <TableFilters
          kind={tab === "skaters" ? "skaters" : "goalies"}
          period={period}
          onPeriod={setPeriod}
          periodsDisabled={seasonFallback && period === "season"}
          sortKey={sortKey}
          onSortPreset={handleSortPreset}
          filters={filters}
          onFilters={setFilters}
          teams={teamOptions}
          days={scheduleData?.grid?.days ?? []}
          rolesState={rolesState}
          injuriesState={injuriesState}
          shown={sorted.length}
          total={poolSize}
          lyWeight={lyWeight}
          onLyWeight={setLyWeight}
          lyState={lyState}
        />
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

      {tab === "league" && (
        <>
          {leagueLoading && (
            <p className="font-mono text-sm text-rink-ice/60">
              Loading full league stats&hellip; first load only.
            </p>
          )}
          {leagueError && (
            <p className="font-mono text-sm text-rink-line">
              Couldn&rsquo;t load league comparison: {leagueError}
            </p>
          )}
          {!leagueLoading && !leagueError && leagueSkaters && leagueGoalies && (
            <LeagueView
              rawSkaters={leagueSkaters}
              rawGoalies={leagueGoalies}
              ownership={ownership}
            />
          )}
        </>
      )}

      {tab === "optimizer" && (
        <>
          {(leagueLoading || scheduleLoading) && (
            <p className="font-mono text-sm text-rink-ice/60">
              Loading your roster and the schedule&hellip; first load only.
            </p>
          )}
          {(leagueError || scheduleError) && (
            <p className="font-mono text-sm text-rink-line">
              Couldn&rsquo;t load the optimizer: {leagueError || scheduleError}
            </p>
          )}
          {!leagueLoading &&
            !scheduleLoading &&
            !leagueError &&
            !scheduleError &&
            leagueSkaters &&
            leagueGoalies &&
            scheduleData && (
              <OptimizerView
                rawSkaters={leagueSkaters}
                rawGoalies={leagueGoalies}
                grid={scheduleData.grid}
                ownership={ownership}
              />
            )}
        </>
      )}

      {tab === "radar" && (
        <>
          {leagueLoading && (
            <p className="font-mono text-sm text-rink-ice/60">
              Loading player stats&hellip; first load only.
            </p>
          )}
          {leagueError && (
            <p className="font-mono text-sm text-rink-line">
              Couldn&rsquo;t load the radar charts: {leagueError}
            </p>
          )}
          {!leagueLoading && !leagueError && leagueSkaters && leagueGoalies && (
            <RadarView
              rawSkaters={leagueSkaters}
              rawGoalies={leagueGoalies}
              ownership={ownership}
            />
          )}
        </>
      )}

      {tab === "week" && (
        <>
          {leagueLoading && (
            <p className="font-mono text-sm text-rink-ice/60">
              Loading your roster&hellip; first load only.
            </p>
          )}
          {leagueError && (
            <p className="font-mono text-sm text-rink-line">
              Couldn&rsquo;t load the week strategy page: {leagueError}
            </p>
          )}
          {!leagueLoading && !leagueError && leagueSkaters && leagueGoalies && (
            <WeekStrategyView
              rawSkaters={leagueSkaters}
              rawGoalies={leagueGoalies}
              ownership={ownership}
            />
          )}
        </>
      )}

      {isTableTab && loading && (
        <p className="font-mono text-sm text-rink-ice/60">Loading current NHL stats&hellip;</p>
      )}
      {isTableTab && error && (
        <p className="font-mono text-sm text-rink-line">
          Couldn&rsquo;t load NHL data: {error}
        </p>
      )}

      {isTableTab && !loading && !error && lyGoodPlus.length > 0 && (
        <div className="mb-4 rounded border border-rink-gold/40 bg-rink-gold/5 p-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-rink-gold">
            Good tier or better last season &middot; {lyGoodPlus.length}
            {showOnly === "targets" ? " available" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lyGoodPlus.slice(0, 30).map((r: any) => (
              <span
                key={r.playerId}
                className="flex items-center gap-1.5 rounded border border-rink-steel/40 bg-rink-board px-2 py-1 font-mono text-xs text-rink-ice"
                title={`Last season: ${r.lyTier} · now: ${r.tier}${r.owner ? ` · owned by ${r.owner}` : " · free agent"}`}
              >
                {r.name}
                <span
                  className="rounded px-1 text-[10px] font-semibold uppercase"
                  style={{ background: TIER_STYLE[r.lyTier as keyof typeof TIER_STYLE].bg, color: TIER_STYLE[r.lyTier as keyof typeof TIER_STYLE].fg }}
                >
                  {r.lyTier}
                </span>
                <span className="text-rink-ice/40">&rarr;</span>
                <span
                  className="rounded px-1 text-[10px] font-semibold uppercase"
                  style={{ background: TIER_STYLE[r.tier as keyof typeof TIER_STYLE].bg, color: TIER_STYLE[r.tier as keyof typeof TIER_STYLE].fg }}
                >
                  {r.tier}
                </span>
              </span>
            ))}
            {lyGoodPlus.length > 30 && (
              <span className="px-1 py-1 font-mono text-xs text-rink-ice/40">
                +{lyGoodPlus.length - 30} more
              </span>
            )}
          </div>
        </div>
      )}

      {isTableTab && !loading && !error && sorted.length > 0 && (
        <div className="overflow-x-auto rounded border border-rink-steel/40">
          <table className="w-full min-w-[900px] border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Player</th>
                {tab === "skaters" && <th className="px-3 py-2">Pos</th>}
                <th className="px-3 py-2">Tm</th>
                <th className="px-3 py-2">Owner</th>
                <th
                  className="px-3 py-2"
                  title="Tier by VOR rank in the current period, scaled to league starter slots"
                >
                  Tier
                </th>
                {lyState === "ok" && (
                  <th className="px-3 py-2" title="Tier last season, on full-season stats (min 20 GP skaters / 10 GP goalies)">
                    LY
                  </th>
                )}
                {tab === "skaters" && rolesState === "ok" && (
                  <>
                    <th className="px-3 py-2" title="Forward line (L1-L4) or defence pair (D1-D3)">
                      Line
                    </th>
                    <th className="px-3 py-2" title="Power-play unit">
                      PP
                    </th>
                  </>
                )}
                <th className="px-3 py-2 text-right" title="NHL games in the next 7 days">
                  G7
                </th>
                {injuriesState === "ok" && <th className="px-3 py-2">Inj</th>}
                <th className="px-3 py-2 text-right">GP</th>
                {filters.statCols && categories.map((cat) => (
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
                  onClick={() => handleSort("vorPerGame")}
                  className="cursor-pointer px-3 py-2 text-right text-rink-ice/50 hover:text-rink-ice"
                  title="VOR divided by games played"
                >
                  /GP
                </th>
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
                  <td className="px-3 py-1.5 text-rink-ice/60">{r.tri || r.team}</td>
                  <td className="px-2 py-1.5">
                    <select
                      value={r.owner ?? ""}
                      onChange={(e) => handleOwnerChange(r.name, e.target.value || null)}
                      className={`w-full rounded border border-rink-steel/40 bg-rink-board px-1 py-0.5 text-xs ${
                        r.owner === YOUR_TEAM
                          ? "font-semibold text-rink-line"
                          : r.owner
                          ? "text-rink-ice/50"
                          : "text-rink-gold"
                      }`}
                      title="Add/drop this player — saved for everyone, synced across devices"
                    >
                      <option value="">FA</option>
                      {allTeamNames().map((t) => (
                        <option key={t} value={t}>
                          {t === YOUR_TEAM ? "You" : t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: TIER_STYLE[r.tier as keyof typeof TIER_STYLE].bg, color: TIER_STYLE[r.tier as keyof typeof TIER_STYLE].fg }}
                    >
                      {r.tier}
                    </span>
                  </td>
                  {lyState === "ok" && (
                    <td className="px-3 py-1.5">
                      {r.lyTier ? (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ background: TIER_STYLE[r.lyTier as keyof typeof TIER_STYLE].bg, color: TIER_STYLE[r.lyTier as keyof typeof TIER_STYLE].fg }}
                        >
                          {r.lyTier}
                        </span>
                      ) : (
                        <span className="text-rink-ice/30">—</span>
                      )}
                    </td>
                  )}
                  {tab === "skaters" && rolesState === "ok" && (
                    <>
                      <td
                        className={`px-3 py-1.5 ${
                          r.role?.line === "L1" || r.role?.line === "D1"
                            ? "text-rink-gold"
                            : "text-rink-ice/60"
                        }`}
                        title={
                          r.role
                            ? r.role.src === "lines"
                              ? "From Daily Faceoff line combinations"
                              : "Inferred from ice time"
                            : "No line data"
                        }
                      >
                        {r.role?.line ?? "—"}
                        {r.role?.src === "inferred" && <span className="text-rink-ice/30">*</span>}
                      </td>
                      <td
                        className={`px-3 py-1.5 ${
                          r.role?.pp === "PP1" ? "text-rink-gold" : "text-rink-ice/60"
                        }`}
                      >
                        {r.role?.pp ?? "—"}
                      </td>
                    </>
                  )}
                  <td className="stat-num px-3 py-1.5 text-right text-rink-ice/60">
                    {r.games7 ?? "—"}
                  </td>
                  {injuriesState === "ok" && (
                    <td
                      className={`px-3 py-1.5 text-xs ${
                        r.injury?.severity === "out" ? "text-rink-line" : "text-rink-gold"
                      }`}
                      title={r.injury ? `${r.injury.status}${r.injury.detail ? ` — ${r.injury.detail}` : ""}` : undefined}
                    >
                      {r.injury ? (r.injury.severity === "out" ? "OUT" : "DTD") : ""}
                    </td>
                  )}
                  <td className="stat-num px-3 py-1.5 text-right text-rink-ice/60">
                    {r.gamesPlayed}
                  </td>
                  {filters.statCols && categories.map((cat) => {
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
                  <td className="stat-num px-3 py-1.5 text-right text-rink-ice/50">
                    {r.vorPerGame.toFixed(2)}
                  </td>
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

      {isTableTab && !loading && !error && sorted.length === 0 && (
        <p className="font-mono text-sm text-rink-ice/60">
          No players match the current filters.
        </p>
      )}

      {rosterSaveError && (
        <p className="mt-3 font-mono text-sm text-rink-line">
          Couldn&rsquo;t save that roster change: {rosterSaveError}
        </p>
      )}

      <footer className="mt-8 font-mono text-xs text-rink-ice/40">
        Data: NHL stats API. Ownership {yahooConnected ? "syncs live from Yahoo" : "starts from your league's latest roster import"}, plus any add/drop edits made here &mdash; synced across
        devices. Use the Owner dropdown on any player to update it.
        {Object.keys(rosterOverrides).length > 0 && (
          <button
            onClick={handleResetAllEdits}
            className="mt-3 block rounded border border-rink-steel/50 px-3 py-1.5 uppercase tracking-wide text-rink-ice/70 hover:text-rink-ice"
          >
            Reset all roster edits ({Object.keys(rosterOverrides).length})
          </button>
        )}
      </footer>
    </main>
  );
}
