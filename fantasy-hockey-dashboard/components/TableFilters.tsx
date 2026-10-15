"use client";

import {
  PERIODS,
  POS_CHIPS,
  TIER_NAMES,
  LINE_OPTIONS,
  PP_OPTIONS,
  ROLE_PRESETS,
  DEFAULT_FILTERS,
  activeFilterCount,
  type Filters,
  type Period,
} from "@/lib/tableFilters";

function Chips<T extends string>({
  options,
  value,
  onChange,
  disabled,
  title,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <div
      className={`flex overflow-hidden rounded border border-rink-steel/50 ${disabled ? "opacity-40" : ""}`}
      title={title}
    >
      {options.map((o) => (
        <button
          key={o.id}
          disabled={disabled}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
            value === o.id
              ? "bg-rink-gold text-rink-board"
              : "bg-transparent text-rink-ice/70 hover:text-rink-ice"
          } ${disabled ? "cursor-not-allowed" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  on,
  label,
  onClick,
  title,
  disabled,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded border px-2.5 py-1 font-mono text-xs uppercase tracking-wide transition-colors ${
        on
          ? "border-rink-gold bg-rink-gold text-rink-board"
          : "border-rink-steel/50 text-rink-ice/70 hover:text-rink-ice"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {label}
    </button>
  );
}

const selectCls =
  "rounded border border-rink-steel/50 bg-rink-board px-2 py-1.5 font-mono text-xs text-rink-ice";
const labelCls = "mb-1 block font-mono text-[10px] uppercase tracking-wide text-rink-ice/40";

export default function TableFilters({
  kind,
  period,
  onPeriod,
  periodsDisabled,
  sortKey,
  onSortPreset,
  filters,
  onFilters,
  teams,
  days,
  rolesState,
  injuriesState,
  shown,
  total,
  lyWeight,
  onLyWeight,
  lyState,
}: {
  kind: "skaters" | "goalies";
  period: Period;
  onPeriod: (p: Period) => void;
  periodsDisabled: boolean;
  sortKey: string;
  onSortPreset: (k: "valueAboveReplacement" | "vorPerGame") => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  teams: string[];
  days: { date: string; label: string }[];
  rolesState: "loading" | "ok" | "unavailable";
  injuriesState: "loading" | "ok" | "unavailable";
  shown: number;
  total: number;
  lyWeight: number;
  onLyWeight: (w: number) => void;
  lyState: "loading" | "ok" | "unavailable" | "off";
}) {
  const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });
  const toggleIn = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  const active = activeFilterCount(filters);
  const rolesOff = rolesState !== "ok";

  return (
    <div className="mb-4 space-y-3 rounded border border-rink-steel/40 bg-rink-steel/10 p-4">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <span className={labelCls}>Period</span>
          <Chips
            options={PERIODS.map((p) => ({ id: p.id, label: p.label }))}
            value={period}
            onChange={onPeriod}
            disabled={periodsDisabled}
            title={
              periodsDisabled
                ? "Date windows need current-season games — the dashboard is still showing last season's stats"
                : "Stats from only the last 7 / 15 / 30 days. VOR is re-scored against that window."
            }
          />
        </div>

        <div>
          <span className={labelCls}>Sort by</span>
          <Chips
            options={[
              { id: "valueAboveReplacement", label: "VOR" },
              { id: "vorPerGame", label: "VOR / GP" },
            ]}
            value={sortKey === "vorPerGame" ? "vorPerGame" : sortKey === "valueAboveReplacement" ? "valueAboveReplacement" : ("" as any)}
            onChange={(k) => onSortPreset(k as any)}
            title="VOR = total value above replacement. VOR / GP divides by games played (small samples swing it — raise Min GP). You can also click any category header to sort by it."
          />
        </div>

        {kind === "skaters" && (
          <div>
            <span className={labelCls}>Position</span>
            <Chips
              options={POS_CHIPS}
              value={filters.pos}
              onChange={(pos) => set({ pos })}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div>
          <label className={labelCls}>NHL team</label>
          <select value={filters.team} onChange={(e) => set({ team: e.target.value })} className={selectCls}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} title="Ranked by VOR within the current period, scaled to the league's starter slots">
            Tier
          </label>
          <select
            value={filters.tier}
            onChange={(e) => set({ tier: e.target.value as Filters["tier"] })}
            className={selectCls}
            title="Ranked by a blend of this period and last season (see the Last season counts slider). Superstar = top 8% of league starter slots, Elite = next 17%, Good = next 35%, Depth = rest of the starters, Replacement = below the starter line"
          >
            <option value="">All tiers</option>
            {TIER_NAMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className={labelCls}
            title="How much last season counts toward the tier. Both seasons are turned into VOR percentiles and blended; players with no qualifying last season are judged on the current period only."
          >
            Last season counts{" "}
            <span className="text-rink-gold">
              {lyState === "ok" ? `${Math.round(lyWeight * 100)}%` : lyState === "loading" ? "…" : "n/a"}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={Math.round(lyWeight * 100)}
            onChange={(e) => onLyWeight(Number(e.target.value) / 100)}
            disabled={lyState !== "ok"}
            className="w-32 accent-rink-line disabled:opacity-40"
            title={
              lyState === "off"
                ? "Already showing last season's stats, so there's nothing to blend"
                : lyState === "unavailable"
                ? "Last season's stats couldn't be loaded"
                : "0% = this period only, 100% = last season only"
            }
          />
        </div>

        <div>
          <label className={labelCls}>Plays on</label>
          <select
            value={filters.playsOn}
            onChange={(e) => set({ playsOn: e.target.value })}
            className={selectCls}
            disabled={days.length === 0}
            title={days.length === 0 ? "Schedule still loading" : "Only players whose NHL team has a game that day"}
          >
            <option value="">Any day</option>
            {days.map((d) => (
              <option key={d.date} value={d.date}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Search</label>
          <input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Player name"
            className={`${selectCls} w-40`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-0.5">
          <Toggle
            on={filters.statCols}
            label="Stat columns"
            onClick={() => set({ statCols: !filters.statCols })}
            title="Show each league category's raw stat"
          />
          <Toggle
            on={filters.pinLY}
            label="Pin last yr Good+"
            onClick={() => set({ pinLY: !filters.pinLY })}
            disabled={lyState !== "ok"}
            title="Sort anyone who was Good tier or better last season to the top of the list"
          />
          <Toggle
            on={filters.hideInjured}
            label="Hide injured"
            onClick={() => set({ hideInjured: !filters.hideInjured })}
            disabled={injuriesState === "unavailable"}
            title={
              injuriesState === "unavailable"
                ? "Injury feed couldn't be loaded"
                : "Hide anyone on the NHL injury report (Out, IR and Day-To-Day)"
            }
          />
        </div>
      </div>

      {kind === "skaters" && (
        <div className="space-y-2 border-t border-rink-steel/30 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-rink-ice/40">
              Role search
            </span>
            {rolesState === "loading" && (
              <span className="font-mono text-[10px] text-rink-ice/40">loading line combos&hellip;</span>
            )}
            {rolesState === "unavailable" && (
              <span className="font-mono text-[10px] text-rink-line">
                line data unavailable &mdash; role filters are off
              </span>
            )}
          </div>
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${rolesOff ? "opacity-40" : ""}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] text-rink-ice/40">Line</span>
              {LINE_OPTIONS.map((l) => (
                <Toggle
                  key={l}
                  on={filters.lines.includes(l)}
                  label={l}
                  disabled={rolesOff}
                  onClick={() => set({ lines: toggleIn(filters.lines, l) })}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] text-rink-ice/40">PP</span>
              {PP_OPTIONS.map((p) => (
                <Toggle
                  key={p}
                  on={filters.pps.includes(p)}
                  label={p === "None" ? "No PP" : p}
                  disabled={rolesOff}
                  onClick={() => set({ pps: toggleIn(filters.pps, p) })}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] text-rink-ice/40">Presets</span>
              {ROLE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  disabled={rolesOff}
                  onClick={() => set({ lines: p.lines, pps: p.pps })}
                  className="rounded border border-rink-steel/50 px-2.5 py-1 font-mono text-xs text-rink-ice/70 hover:text-rink-ice"
                >
                  {p.label}
                </button>
              ))}
              <button
                disabled={rolesOff}
                onClick={() => set({ lines: [], pps: [] })}
                className="rounded border border-rink-steel/50 px-2.5 py-1 font-mono text-xs text-rink-gold hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-rink-steel/30 pt-2 font-mono text-xs text-rink-ice/50">
        <span>
          Showing <span className="text-rink-ice">{shown}</span> of {total}
          {active > 0 && <> &middot; {active} filter{active === 1 ? "" : "s"} on</>}
        </span>
        {active > 0 && (
          <button
            onClick={() => onFilters({ ...DEFAULT_FILTERS, statCols: filters.statCols })}
            className="text-rink-gold hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
