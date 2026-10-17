"use client";

import { useMemo, useState } from "react";
import {
  SKATER_AXES,
  GOALIE_AXES,
  computeRadar,
  formatAxisValue,
  type RadarAxis,
  type RadarBasis,
  type RadarEntry,
  type RadarGroupBasis,
  type RadarPoolScope,
} from "@/lib/radar";
import { allTeamNames } from "@/lib/rosterLookup";
import { effectiveOwner, YOUR_TEAM, type OwnershipMap } from "@/lib/effectiveRoster";

const MAX_COMPARE = 4;
const PAGE = 48;

// One color per compared player. Red and amber are the team accents; the
// other two are picked to stay distinguishable from them on the dark board.
const SERIES = ["#C8102E", "#D98E2B", "#E9E7E4", "#3FB8AF"];

const POS_LABEL: Record<string, string> = { C: "C", L: "LW", R: "RW", D: "D", G: "G" };

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
        active
          ? "border-rink-gold bg-rink-gold text-rink-board"
          : "border-rink-steel/50 text-rink-ice/70 hover:text-rink-ice"
      }`}
    >
      {children}
    </button>
  );
}

function Radar({
  series,
  axes,
  size,
  pad,
  labelGap,
  fontSize,
  dot,
  label,
}: {
  series: { pct: number[]; color: string }[];
  axes: RadarAxis[];
  size: number;
  pad: number;
  labelGap: number;
  fontSize: number;
  dot: number;
  label: string;
}) {
  const c = size / 2;
  const R = c - pad;
  const n = axes.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number): [number, number] => [
    c + Math.cos(ang(i)) * r,
    c + Math.sin(ang(i)) * r,
  ];
  const fx = (v: number) => v.toFixed(1);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={axes.map((_, i) => pt(i, R * r).map(fx).join(",")).join(" ")}
          fill="none"
          stroke="#53565C"
          strokeOpacity={r === 1 ? 0.8 : 0.4}
          strokeWidth={r === 1 ? 1.4 : 1}
        />
      ))}
      {axes.map((_, i) => {
        const p = pt(i, R);
        return (
          <line key={i} x1={fx(c)} y1={fx(c)} x2={fx(p[0])} y2={fx(p[1])} stroke="#53565C" strokeOpacity={0.4} />
        );
      })}
      {series.map((s, k) => {
        const pts = s.pct.map((p, i) => pt(i, (R * p) / 100));
        return (
          <g key={k}>
            <polygon
              points={pts.map((p) => p.map(fx).join(",")).join(" ")}
              fill={s.color}
              fillOpacity={0.2}
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {pts.map((p, i) => (
              <circle key={i} cx={fx(p[0])} cy={fx(p[1])} r={dot} fill="#0B0B0C" stroke={s.color} strokeWidth={2} />
            ))}
          </g>
        );
      })}
      {axes.map((ax, i) => {
        const p = pt(i, R + labelGap);
        const co = Math.cos(ang(i));
        const anchor = co > 0.3 ? "start" : co < -0.3 ? "end" : "middle";
        return (
          <text
            key={ax.key}
            x={fx(p[0])}
            y={fx(p[1])}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={fontSize}
            fill="#E9E7E4"
            fillOpacity={0.7}
            fontFamily="var(--font-mono), monospace"
          >
            {ax.abbrev}
          </text>
        );
      })}
    </svg>
  );
}

function ownerTag(owner: string | null) {
  if (owner === null) return { text: "FA", cls: "text-rink-gold" };
  if (owner === YOUR_TEAM) return { text: "You", cls: "font-semibold text-rink-line" };
  return { text: owner, cls: "text-rink-ice/50" };
}

export default function RadarView({
  rawSkaters,
  rawGoalies,
  ownership,
}: {
  rawSkaters: any[];
  rawGoalies: any[];
  ownership: OwnershipMap;
}) {
  const [mode, setMode] = useState<"skaters" | "goalies">("skaters");
  const [minGP, setMinGP] = useState(3);
  const [basis, setBasis] = useState<RadarBasis>("perGame");
  const [scope, setScope] = useState<RadarPoolScope>("rostered");
  const [groupBasis, setGroupBasis] = useState<RadarGroupBasis>("all");
  const [pos, setPos] = useState<"ALL" | "C" | "L" | "R" | "D">("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("avg");
  const [selected, setSelected] = useState<number[]>([]);
  const [shown, setShown] = useState(PAGE);
  const [note, setNote] = useState<string | null>(null);

  const result = useMemo(
    () =>
      computeRadar(
        rawSkaters,
        rawGoalies,
        { minGP, basis, scope, groupBasis },
        (name, pos) => effectiveOwner(name, ownership, pos)
      ),
    [rawSkaters, rawGoalies, minGP, basis, scope, groupBasis, ownership]
  );

  const axes = mode === "skaters" ? SKATER_AXES : GOALIE_AXES;
  const entries = mode === "skaters" ? result.skaters : result.goalies;
  const poolSize = mode === "skaters" ? result.skaterPoolSize : result.goaliePoolSize;
  const byId = useMemo(() => new Map(entries.map((e) => [e.playerId, e])), [entries]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let L = entries;
    if (mode === "skaters" && pos !== "ALL") L = L.filter((e) => e.position === pos);
    if (ownerFilter === "FA") L = L.filter((e) => e.owner === null);
    else if (ownerFilter !== "ALL") L = L.filter((e) => e.owner === ownerFilter);
    if (q) L = L.filter((e) => e.name.toLowerCase().includes(q) || e.team.toLowerCase() === q);
    const axIdx = axes.findIndex((a) => a.key === sortKey);
    const keyOf = (e: RadarEntry) =>
      sortKey === "avg" ? e.avg : sortKey === "gp" ? e.gamesPlayed : axIdx >= 0 ? e.pct[axIdx] : e.avg;
    return [...L].sort((a, b) => keyOf(b) - keyOf(a) || b.avg - a.avg);
  }, [entries, mode, pos, ownerFilter, query, sortKey, axes]);

  const chosen = selected.map((id) => byId.get(id)).filter(Boolean) as RadarEntry[];

  function toggle(id: number) {
    setNote(null);
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_COMPARE) {
        setNote(`Compare up to ${MAX_COMPARE} players. Remove one first.`);
        return cur;
      }
      return [...cur, id];
    });
  }

  function switchMode(m: "skaters" | "goalies") {
    setMode(m);
    setSelected([]);
    setPos("ALL");
    setSortKey("avg");
    setShown(PAGE);
    setNote(null);
  }

  const lowSample = result.medianGP > 0 && result.medianGP < 10;
  const sortOptions = [
    { key: "avg", label: "Average percentile" },
    ...axes.map((a) => ({ key: a.key, label: `${a.abbrev} percentile` })),
    { key: "gp", label: "Games played" },
  ];
  const ownerOptions = ["ALL", "FA", ...allTeamNames()];

  return (
    <div>
      <div className="mb-4 rounded border border-rink-line/30 bg-rink-ash p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-rink-ice/50">
          Category percentiles &mdash; farther from the center is better
        </p>
        <p className="mt-2 font-mono text-xs leading-relaxed text-rink-ice/60">
          Each point is the share of the comparison pool a player beats in that category.
          {" "}
          {scope === "rostered"
            ? `Pool: the ${poolSize} ${mode === "skaters" ? "skaters" : "goalies"} on a roster in your league, so a free agent plotting past the middle ring is already better than a typical rostered player.`
            : `Pool: all ${poolSize} ${mode === "skaters" ? "skaters" : "goalies"} with ${minGP}+ GP.`}
          {mode === "goalies" && " GAA is flipped so a lower number reaches farther out."}
        </p>
        {lowSample && (
          <p className="mt-2 font-mono text-xs text-rink-gold">
            The typical player has only {result.medianGP} GP so far, so small samples swing these
            charts a lot. Per-game basis and a higher Min GP will steady them.
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded border border-rink-steel/50">
          {(["skaters", "goalies"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
                mode === m ? "bg-rink-line text-white" : "text-rink-ice/70 hover:text-rink-ice"
              }`}
            >
              {m === "skaters" ? "Skaters" : "Goalies"}
            </button>
          ))}
        </div>

        {mode === "skaters" && (
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "C", "L", "R", "D"] as const).map((p) => (
              <Chip key={p} active={pos === p} onClick={() => { setPos(p); setShown(PAGE); }}>
                {p === "ALL" ? "All" : POS_LABEL[p]}
              </Chip>
            ))}
          </div>
        )}

        <select
          value={ownerFilter}
          onChange={(e) => { setOwnerFilter(e.target.value); setShown(PAGE); }}
          className="rounded border border-rink-steel/50 bg-rink-board px-2 py-1.5 font-mono text-xs text-rink-ice"
          aria-label="Filter by owner"
        >
          {ownerOptions.map((o) => (
            <option key={o} value={o}>
              {o === "ALL" ? "Any owner" : o === "FA" ? "Free agents" : o === YOUR_TEAM ? `${o} (you)` : o}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
          placeholder="Search name or team"
          aria-label="Search players"
          className="w-48 rounded border border-rink-steel/50 bg-rink-board px-2 py-1.5 font-mono text-xs text-rink-ice placeholder:text-rink-ice/30"
        />

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="rounded border border-rink-steel/50 bg-rink-board px-2 py-1.5 font-mono text-xs text-rink-ice"
          aria-label="Sort by"
        >
          {sortOptions.map((o) => (
            <option key={o.key} value={o.key}>
              Sort: {o.label}
            </option>
          ))}
        </select>
      </div>

      <details className="mb-5 rounded border border-rink-steel/40 bg-rink-steel/10">
        <summary className="cursor-pointer px-4 py-2 font-mono text-xs uppercase tracking-wide text-rink-ice/70">
          Percentile settings
        </summary>
        <div className="grid gap-4 px-4 pb-4 pt-2 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 font-mono text-xs text-rink-ice/50">Counting stats shown as</p>
            <div className="flex gap-1.5">
              <Chip active={basis === "perGame"} onClick={() => setBasis("perGame")} title="Goals, assists, shots and so on divided by games played. Best early in the season.">
                Per game
              </Chip>
              <Chip active={basis === "totals"} onClick={() => setBasis("totals")} title="Season totals. Rewards players who have played more games.">
                Season totals
              </Chip>
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-mono text-xs text-rink-ice/50">Rank players against</p>
            <div className="flex gap-1.5">
              <Chip active={scope === "rostered"} onClick={() => setScope("rostered")}>
                Rostered players
              </Chip>
              <Chip active={scope === "all"} onClick={() => setScope("all")}>
                All NHL players
              </Chip>
            </div>
          </div>
          {mode === "skaters" && (
            <div>
              <p className="mb-1.5 font-mono text-xs text-rink-ice/50">Compare each skater with</p>
              <div className="flex gap-1.5">
                <Chip active={groupBasis === "all"} onClick={() => setGroupBasis("all")} title="Forwards and defensemen in one pool, which is how your categories count them.">
                  All skaters
                </Chip>
                <Chip active={groupBasis === "group"} onClick={() => setGroupBasis("group")} title="Forwards against forwards, defensemen against defensemen.">
                  Own group (F or D)
                </Chip>
              </div>
            </div>
          )}
          <div>
            <p className="mb-1.5 font-mono text-xs text-rink-ice/50">Minimum games played</p>
            <input
              type="number"
              min={0}
              value={minGP}
              onChange={(e) => setMinGP(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 rounded border border-rink-steel/50 bg-rink-board px-2 py-1 font-mono text-sm text-rink-ice"
              aria-label="Minimum games played"
            />
          </div>
          <p className="font-mono text-xs leading-relaxed text-rink-ice/40 sm:col-span-2">
            Anyone at the bottom of the pool in a category plots at the center, so a zero in a rare
            category like SHP does not get a free mid-range percentile.
            {mode === "skaters" &&
              ` SH% is only ranked among skaters with ${result.minShots}+ shots; an asterisk marks players below that.`}
          </p>
        </div>
      </details>

      {chosen.length > 0 && (
        <div className="mb-6 rounded border border-rink-steel/40 bg-rink-ash p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {chosen.map((e, k) => (
              <button
                key={e.playerId}
                onClick={() => toggle(e.playerId)}
                aria-label={`Remove ${e.name} from comparison`}
                className="flex items-center gap-2 rounded border border-rink-steel/50 px-2.5 py-1.5 font-mono text-sm text-rink-ice hover:border-rink-ice/50"
              >
                <span className="h-3 w-3 rounded-full" style={{ background: SERIES[k] }} />
                {e.name}
                <span className="text-xs text-rink-ice/40">
                  {POS_LABEL[e.position] ?? e.position} {e.team}
                </span>
                <span className="text-rink-ice/40">&times;</span>
              </button>
            ))}
            <button
              onClick={() => setSelected([])}
              className="px-2 font-mono text-xs text-rink-gold hover:underline"
            >
              Clear
            </button>
          </div>

          <div className="grid items-start gap-6 md:grid-cols-[minmax(0,420px)_1fr]">
            <div className="mx-auto w-full max-w-[420px]">
              <Radar
                series={chosen.map((e, k) => ({ pct: e.pct, color: SERIES[k] }))}
                axes={axes}
                size={360}
                pad={52}
                labelGap={20}
                fontSize={14}
                dot={4.5}
                label={`Radar chart comparing ${chosen.map((e) => e.name).join(", ")}`}
              />
              <p className="mt-1 text-center font-mono text-xs text-rink-ice/40">
                Rings: 25th, 50th, 75th and 100th percentile
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
                    <th className="px-2 py-2">Category</th>
                    {chosen.map((e, k) => (
                      <th key={e.playerId} className="px-2 py-2 text-right" style={{ color: SERIES[k] }}>
                        {e.name.split(" ").slice(-1)[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {axes.map((ax, ai) => (
                    <tr key={ax.key} className="border-b border-rink-steel/10">
                      <td className="px-2 py-1.5 text-rink-ice/70" title={ax.label}>
                        {ax.abbrev}
                      </td>
                      {chosen.map((e) => (
                        <td key={e.playerId} className="stat-num px-2 py-1.5 text-right text-rink-ice">
                          {formatAxisValue(ax, e.values[ai], basis)}
                          {e.thin[ai] ? "*" : ""}
                          <span className="ml-2 text-xs text-rink-ice/40">{Math.round(e.pct[ai])}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-2 py-1.5 text-rink-gold">Avg pctl</td>
                    {chosen.map((e) => (
                      <td key={e.playerId} className="stat-num px-2 py-1.5 text-right font-semibold text-rink-gold">
                        {Math.round(e.avg)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 text-rink-ice/50">GP</td>
                    {chosen.map((e) => (
                      <td key={e.playerId} className="stat-num px-2 py-1.5 text-right text-rink-ice/60">
                        {e.gamesPlayed}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 font-mono text-xs text-rink-ice/40">
                Small number beside each value is the percentile.
              </p>
            </div>
          </div>
        </div>
      )}

      {note && <p className="mb-3 font-mono text-xs text-rink-gold">{note}</p>}

      <p className="mb-3 font-mono text-xs text-rink-ice/50">
        {list.length} {mode}. Tap a card to add it to the comparison above.
      </p>

      {list.length === 0 ? (
        <p className="font-mono text-sm text-rink-ice/60">
          No players match. Try lowering Min GP or clearing a filter.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.slice(0, shown).map((e) => {
            const idx = selected.indexOf(e.playerId);
            const on = idx >= 0;
            const tag = ownerTag(e.owner);
            return (
              <button
                key={e.playerId}
                onClick={() => toggle(e.playerId)}
                aria-pressed={on}
                className={`relative rounded border bg-rink-ash p-2.5 text-left transition-colors ${
                  on ? "border-rink-gold" : "border-rink-steel/40 hover:border-rink-ice/40"
                }`}
              >
                {on && (
                  <span
                    className="absolute right-2 top-2 h-3 w-3 rounded-full"
                    style={{ background: SERIES[idx] }}
                  />
                )}
                <span className="block truncate pr-5 font-mono text-sm font-semibold text-rink-ice">
                  {e.name}
                </span>
                <span className="flex justify-between font-mono text-xs text-rink-ice/50">
                  <span>
                    {POS_LABEL[e.position] ?? e.position} {e.team}
                  </span>
                  <span className={tag.cls}>{tag.text}</span>
                </span>
                <div className="mx-auto my-1 max-w-[170px]">
                  <Radar
                    series={[{ pct: e.pct, color: "#C8102E" }]}
                    axes={axes}
                    size={160}
                    pad={30}
                    labelGap={11}
                    fontSize={10}
                    dot={2.6}
                    label={`Radar chart for ${e.name}`}
                  />
                </div>
                <span className="flex justify-between font-mono text-xs text-rink-ice/50">
                  <span>{e.gamesPlayed} GP</span>
                  <span>Avg {Math.round(e.avg)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {list.length > shown && (
        <button
          onClick={() => setShown((s) => s + PAGE)}
          className="mx-auto mt-5 block rounded border border-rink-steel/50 px-5 py-2 font-mono text-xs uppercase tracking-wide text-rink-ice/70 hover:text-rink-ice"
        >
          Show {Math.min(PAGE, list.length - shown)} more
        </button>
      )}
    </div>
  );
}
