"use client";

import { useMemo, useState } from "react";
import {
  buildYourRosterPlayers,
  computeDailyLineups,
  findStreamSuggestions,
} from "@/lib/rosterOptimizer";
import type { OwnershipMap } from "@/lib/effectiveRoster";

const SLOT_LABELS: Record<string, string> = {
  C: "Center",
  LW: "Left Wing",
  RW: "Right Wing",
  F: "Flex Forward",
  D: "Defense",
  Util: "Utility",
  G: "Goalie",
};

export default function OptimizerView({
  rawSkaters,
  rawGoalies,
  grid,
  ownership,
}: {
  rawSkaters: any[];
  rawGoalies: any[];
  grid: any;
  ownership: OwnershipMap;
}) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const rosterPlayers = useMemo(
    () => buildYourRosterPlayers(rawSkaters, rawGoalies, ownership),
    [rawSkaters, rawGoalies, ownership]
  );

  const lineups = useMemo(
    () => computeDailyLineups(rosterPlayers, grid),
    [rosterPlayers, grid]
  );

  return (
    <div>
      <p className="mb-4 max-w-2xl font-mono text-xs text-rink-ice/50">
        Your actual roster, simulated day by day against the NHL schedule. Open
        slots (gold) are days you could add a streamer with zero downside &mdash;
        benched players (red) are days you're already overloaded at a position.
        Tap a day to see free agents that fit the opening.
      </p>

      <div className="space-y-3">
        {lineups.map((day) => {
          const isOpen = expandedDay === day.date;
          const hasOpenings = day.openSlots.length > 0;
          const hasBench = day.benched.length > 0;

          return (
            <div key={day.date} className="rounded border border-rink-steel/40">
              <button
                onClick={() => setExpandedDay(isOpen ? null : day.date)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-display text-base tracking-wide text-rink-ice">
                  {day.label}
                </span>
                <div className="flex items-center gap-3 font-mono text-xs">
                  {hasOpenings && (
                    <span className="text-rink-gold">
                      {day.openSlots.reduce((a, o) => a + o.count, 0)} open
                    </span>
                  )}
                  {hasBench && (
                    <span className="text-rink-line">{day.benched.length} benched</span>
                  )}
                  {!hasOpenings && !hasBench && (
                    <span className="text-rink-ice/40">full lineup</span>
                  )}
                  <span className="text-rink-ice/30">{isOpen ? "\u2212" : "+"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-rink-steel/40 px-4 py-3 font-mono text-sm">
                  {hasOpenings && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs uppercase tracking-wide text-rink-gold">
                        Open slots
                      </p>
                      {day.openSlots.map((slot) => (
                        <OpenSlotRow
                          key={slot.type}
                          slotType={slot.type}
                          count={slot.count}
                          date={day.date}
                          grid={grid}
                          rawSkaters={rawSkaters}
                          rawGoalies={rawGoalies}
                          ownership={ownership}
                        />
                      ))}
                    </div>
                  )}
                  {hasBench && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-rink-line">
                        Benched (bumped by position overload)
                      </p>
                      {day.benched.map((p) => (
                        <p key={p.name} className="text-rink-ice/70">
                          {p.name} <span className="text-rink-ice/40">({p.position})</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {!hasOpenings && !hasBench && (
                    <p className="text-rink-ice/50">Every active slot filled, nobody bumped.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpenSlotRow({
  slotType,
  count,
  date,
  grid,
  rawSkaters,
  rawGoalies,
  ownership,
}: {
  slotType: string;
  count: number;
  date: string;
  grid: any;
  rawSkaters: any[];
  rawGoalies: any[];
  ownership: OwnershipMap;
}) {
  const suggestions = useMemo(
    () => findStreamSuggestions(slotType, date, grid, rawSkaters, rawGoalies, ownership, 3),
    [slotType, date, grid, rawSkaters, rawGoalies, ownership]
  );

  return (
    <div className="mb-3">
      <p className="text-rink-ice/80">
        {SLOT_LABELS[slotType] ?? slotType} &times; {count}
      </p>
      {suggestions.length > 0 ? (
        <ul className="ml-3 mt-1 space-y-0.5">
          {suggestions.map((s) => (
            <li key={s.name} className="text-xs text-rink-ice/60">
              <span className="text-rink-ice">{s.name}</span> ({s.team}) &mdash; VOR-score{" "}
              {s.overallScore.toFixed(2)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ml-3 mt-1 text-xs text-rink-ice/40">
          No free agents at this position play today.
        </p>
      )}
    </div>
  );
}
