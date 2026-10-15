"use client";

import { useMemo, useState } from "react";
import { buildMakeup, type Group, type MakeupPlayer, type Signal } from "@/lib/makeup";
import { TIER_NAMES, TIER_STYLE, type TierName } from "@/lib/tableFilters";
import { YOUR_TEAM } from "@/lib/rosterLookup";
import type { OwnershipMap } from "@/lib/effectiveRoster";
import type { InjuryInfo } from "@/lib/injuries";

const GROUP_LABEL: Record<Group, string> = { F: "Forwards", D: "Defence", G: "Goalies" };
const SIGNAL_STYLE: Record<Signal, string> = {
  Core: "bg-rink-line text-white",
  Keep: "border border-rink-steel/60 text-rink-ice/80",
  Watch: "bg-rink-gold/25 font-semibold text-rink-gold",
  "Drop candidate": "bg-rink-ember font-semibold text-white",
  IR: "border border-rink-steel/60 text-rink-ice/40",
  Unrated: "border border-rink-steel/60 text-rink-ice/40",
};
const SLOT_LABEL = { Lineup: "", Bench: "Bench", IR: "IR", Reserve: "NA / reserve" } as const;

function Badge({ tier, small }: { tier: TierName | null; small?: boolean }) {
  if (!tier)
    return (
      <span className={`inline-block rounded border border-rink-steel/40 px-1.5 py-0.5 text-[10px] text-rink-ice/40 ${small ? "" : "w-[78px] text-center"}`}>
        –
      </span>
    );
  const s = TIER_STYLE[tier];
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${small ? "" : "w-[78px] text-center"}`}
      style={{ background: s.bg, color: s.fg }}
    >
      {tier}
    </span>
  );
}

function Row({ p }: { p: MakeupPlayer }) {
  const hurt = p.injury;
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 px-3 py-2.5 ${p.slot === "IR" ? "opacity-70" : ""}`}>
      <div className="min-w-[180px] flex-1">
        <div className="font-semibold text-rink-ice">{p.name}</div>
        <div className="text-xs text-rink-ice/50">
          {p.nhl || "—"} &middot; {p.pos}
          {SLOT_LABEL[p.slot] ? <> &middot; {SLOT_LABEL[p.slot]}</> : null}
          {hurt && (
            <span className={hurt.severity === "out" ? "text-rink-line" : "text-rink-gold"}>
              {" "}
              &middot; {hurt.severity === "out" ? "OUT" : "DTD"}
              {hurt.detail ? ` (${hurt.detail})` : ""}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge tier={p.tier} />
        <div className="text-[11px] leading-tight text-rink-ice/50">
          {p.basis === "lastSeason" ? (
            <>on last season</>
          ) : p.basis === "blend" ? (
            <>
              LY <Badge tier={p.lyTier} small />
            </>
          ) : p.lyTier ? (
            <>
              LY <Badge tier={p.lyTier} small />
            </>
          ) : (
            <>{p.gp} GP</>
          )}
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 text-xs">
        <span className={`rounded px-1.5 py-0.5 ${SIGNAL_STYLE[p.signal]}`}>{p.signal}</span>
        <span className="text-rink-ice/50">{p.why}</span>
      </div>
      {p.better && (
        <div className="w-full text-xs text-rink-ice/80">
          Available: <span className="font-semibold">{p.better.name}</span> ({p.better.team || "—"}){" "}
          <Badge tier={p.better.tier} small />
        </div>
      )}
    </div>
  );
}

export default function MakeupView({
  rawSkaters,
  rawGoalies,
  lySkaters,
  lyGoalies,
  weights,
  lyWeight,
  ownership,
  injuries,
}: {
  rawSkaters: any[];
  rawGoalies: any[];
  lySkaters: any[] | null;
  lyGoalies: any[] | null;
  weights: Record<string, number>;
  lyWeight: number;
  ownership: OwnershipMap;
  injuries: Record<string, InjuryInfo> | null;
}) {
  const [selected, setSelected] = useState<string>(YOUR_TEAM);

  const teams = useMemo(
    () => buildMakeup({ rawSkaters, rawGoalies, lySkaters, lyGoalies, weights, lyWeight, ownership, injuries }),
    [rawSkaters, rawGoalies, lySkaters, lyGoalies, weights, lyWeight, ownership, injuries]
  );
  const byRank = useMemo(() => [...teams].sort((a, b) => a.rating.rank - b.rating.rank), [teams]);
  const team = teams.find((t) => t.team === selected) ?? null;
  const shortName = (t: string) => (t === YOUR_TEAM ? "You" : t);

  return (
    <div className="font-mono text-sm">
      <p className="mb-5 max-w-3xl text-xs text-rink-ice/60">
        Every roster by tier, graded against the other eleven teams. Tiers are the same ones as the Skaters and Goalies tabs: this season&rsquo;s value-over-replacement
        rank, pulled {Math.round(lyWeight * 100)}% toward last season&rsquo;s (change it with the &ldquo;Last season counts&rdquo; slider on those tabs). A player with too few
        games this season is rated on last season alone.
      </p>

      <section className="mb-8">
        <h2 className="mb-1 font-display text-xl tracking-wide text-rink-ice">Team ratings</h2>
        <p className="mb-2 text-xs text-rink-ice/50">
          50 = league average. Superstar 10 pts, Elite 6, Good 3, Depth 1, Replacement 0; lineup players count in full, bench at 40%, IR and reserve not at all. Lineup, bench and IR are
          worked out from your rosters (best fit to the real slots, with players the injury report lists as Out on IR) &mdash; Yahoo&rsquo;s actual slots aren&rsquo;t synced.
        </p>
        <div className="overflow-x-auto rounded border border-rink-steel/40">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-rink-steel/40 text-left text-xs uppercase tracking-wide text-rink-ice/50">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-center">Grade</th>
                <th className="px-3 py-2 text-center">Rating</th>
                <th className="px-3 py-2 text-center">F</th>
                <th className="px-3 py-2 text-center">D</th>
                <th className="px-3 py-2 text-center">G</th>
              </tr>
            </thead>
            <tbody>
              {byRank.map((t) => (
                <tr
                  key={t.team}
                  onClick={() => setSelected(t.team)}
                  className={`cursor-pointer border-b border-rink-steel/10 hover:bg-rink-steel/10 ${t.team === selected ? "bg-rink-steel/15" : ""}`}
                >
                  <td className="px-3 py-1.5 text-rink-ice/40">{t.rating.rank}</td>
                  <td className={`whitespace-nowrap px-3 py-1.5 ${t.team === YOUR_TEAM ? "font-semibold text-rink-line" : "text-rink-ice"}`}>{shortName(t.team)}</td>
                  <td className="px-3 py-1.5 text-center font-display text-base text-rink-gold">{t.rating.grade}</td>
                  <td className="stat-num px-3 py-1.5 text-center text-rink-ice">{t.rating.rating}</td>
                  {(["F", "D", "G"] as const).map((g) => (
                    <td
                      key={g}
                      className={`stat-num px-3 py-1.5 text-center ${t.rating.groups[g] >= 60 ? "text-rink-gold" : t.rating.groups[g] <= 40 ? "text-rink-line" : "text-rink-ice/50"}`}
                    >
                      {t.rating.groups[g]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-1 font-display text-xl tracking-wide text-rink-ice">All teams</h2>
        <p className="mb-2 text-xs text-rink-ice/50">Players by tier on each roster (IR and reserve not counted). Click a team for its players.</p>
        <div className="overflow-x-auto rounded border border-rink-steel/40">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-rink-steel/40 text-xs text-rink-ice/50">
                <th className="px-3 py-2 text-left uppercase tracking-wide">Team</th>
                {TIER_NAMES.map((t) => (
                  <th key={t} className="px-2 py-2 text-center">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ background: TIER_STYLE[t].bg }} title={t} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr
                  key={t.team}
                  onClick={() => setSelected(t.team)}
                  className={`cursor-pointer border-b border-rink-steel/10 hover:bg-rink-steel/10 ${t.team === selected ? "bg-rink-steel/15" : ""}`}
                >
                  <td className={`whitespace-nowrap px-3 py-1.5 ${t.team === YOUR_TEAM ? "font-semibold text-rink-line" : "text-rink-ice"}`}>{shortName(t.team)}</td>
                  {TIER_NAMES.map((k) => (
                    <td key={k} className={`stat-num px-2 py-1.5 text-center ${t.counts[k] === 0 ? "text-rink-ice/20" : "text-rink-ice"}`}>
                      {t.counts[k]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-rink-ice/50">
          {TIER_NAMES.map((t) => (
            <span key={t} className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: TIER_STYLE[t].bg }} /> {t}
            </span>
          ))}
        </p>
      </section>

      {team && (
        <section>
          <h2 className="mb-1 font-display text-2xl tracking-wide text-rink-ice">{team.team}</h2>
          <p className="mb-4 text-sm">
            <span className="font-display text-lg text-rink-gold">{team.rating.grade}</span>{" "}
            <span className="text-rink-ice/50">
              &middot; #{team.rating.rank} of {teams.length} &middot; rating {team.rating.rating}
            </span>
            <span className="block text-xs text-rink-ice/50">{team.rating.note}</span>
          </p>
          {(["F", "D", "G"] as const).map((g) => {
            const list = team.players.filter((p) => p.group === g);
            if (list.length === 0) return null;
            return (
              <div key={g} className="mb-6">
                <h3 className="mb-1 font-display text-lg tracking-wide text-rink-ice/80">{GROUP_LABEL[g]}</h3>
                <div className="divide-y divide-rink-steel/20 rounded border border-rink-steel/40">
                  {list.map((p) => (
                    <Row key={p.name} p={p} />
                  ))}
                </div>
              </div>
            );
          })}
          <p className="max-w-3xl text-xs text-rink-ice/50">
            Core is Good tier and above, Keep is Depth, Drop candidate is Replacement. Watch means Replacement so far but Good or better last season. &ldquo;Available&rdquo; is the
            best free agent in the same group who rates above him. Category needs are on the League tab; this view is about overall roster quality.
          </p>
        </section>
      )}
    </div>
  );
}
