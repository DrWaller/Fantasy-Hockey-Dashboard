// Shared (client + server safe) types and key helpers for player roles:
// forward line / defence pair and power-play unit. Roles are keyed by
// "<NHL tri-code>|<normalized name>" so a name collision across teams
// can't mix two players up.
import { normalizeName, playerKey, AMBIGUOUS_NAMES, posGroup } from "./rosterLookup";

export type Role = {
  line: string | null; // L1-L4 forwards, D1-D3 defence
  pp: "PP1" | "PP2" | null;
  src: "lines" | "inferred"; // Daily Faceoff line combos vs. inferred from ice time
};

export type RolesPayload = {
  ok: boolean;
  roles: Record<string, Role>;
  teamsOk: string[]; // teams whose real line combinations were read
  teamsFailed: string[];
  inferredFrom: boolean; // whether the ice-time inference had data
  updatedAt: string | null;
  error?: string;
};

export const roleKey = (tri: string, name: string, pos?: string | null) => `${tri}|${playerKey(name, pos)}`;

// "first initial + rest of name" fallback, e.g. "a ovechkin"
export const initialKey = (tri: string, name: string, pos?: string | null) => {
  const full = normalizeName(name);
  const n = full.split(" ");
  const suffix = AMBIGUOUS_NAMES.has(full) && pos ? `|${posGroup(pos)}` : "";
  return `${tri}|${n[0]?.[0] ?? ""} ${n.slice(1).join(" ")}${suffix}`;
};

export function lookupRole(
  roles: Record<string, Role> | null | undefined,
  tri: string,
  name: string,
  pos?: string | null
): Role | null {
  if (!roles) return null;
  return roles[roleKey(tri, name, pos)] ?? roles[initialKey(tri, name, pos)] ?? null;
}
