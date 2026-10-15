// Shared (client + server safe) types and key helpers for player roles:
// forward line / defence pair and power-play unit. Roles are keyed by
// "<NHL tri-code>|<normalized name>" so a name collision across teams
// can't mix two players up.
import { normalizeName } from "./rosterLookup";

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

export const roleKey = (tri: string, name: string) => `${tri}|${normalizeName(name)}`;

// "first initial + rest of name" fallback, e.g. "a ovechkin"
export const initialKey = (tri: string, name: string) => {
  const n = normalizeName(name).split(" ");
  return `${tri}|${n[0]?.[0] ?? ""} ${n.slice(1).join(" ")}`;
};

export function lookupRole(
  roles: Record<string, Role> | null | undefined,
  tri: string,
  name: string
): Role | null {
  if (!roles) return null;
  return roles[roleKey(tri, name)] ?? roles[initialKey(tri, name)] ?? null;
}
