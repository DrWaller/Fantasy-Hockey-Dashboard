// Parses ESPN's public NHL injuries feed into { normalized name -> status }.
// ESPN doesn't document this endpoint, so the parser is deliberately
// tolerant: it walks whatever nesting it gets and keeps anything that looks
// like { athlete / player name + status }.
import { normalizeName, playerKey, AMBIGUOUS_NAMES } from "./rosterLookup";

export type InjuryInfo = {
  status: string; // e.g. "Out", "Day-To-Day", "Injured Reserve"
  detail: string | null; // e.g. "Upper body"
  severity: "out" | "dtd"; // out = IR / Out; dtd = day-to-day / questionable
};

export type InjuriesPayload = {
  ok: boolean;
  injuries: Record<string, InjuryInfo>;
  error?: string;
};

function severityOf(status: string): "out" | "dtd" {
  const s = status.toLowerCase();
  if (s.includes("day") || s.includes("question") || s.includes("doubt") || s.includes("probable")) return "dtd";
  return "out";
}

export function parseEspnInjuries(json: any): Record<string, InjuryInfo> {
  const out: Record<string, InjuryInfo> = {};
  const visit = (node: any, depth = 0) => {
    if (!node || depth > 6) return;
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, depth + 1));
      return;
    }
    if (typeof node !== "object") return;

    const name: unknown =
      node.athlete?.displayName ??
      node.athlete?.fullName ??
      node.player?.displayName ??
      node.player?.fullName;
    const rawStatus: unknown =
      node.status ?? node.type?.description ?? node.type?.name ?? node.athlete?.injuries?.[0]?.status;
    if (typeof name === "string" && typeof rawStatus === "string" && rawStatus.trim()) {
      const detail: unknown =
        node.details?.type ?? node.details?.detail ?? node.type?.detail ?? node.shortComment ?? null;
      // Same-name players (the two Elias Petterssons) are keyed by position too
      // when ESPN gives one; otherwise they can't be told apart and are skipped.
      const posRaw: unknown = node.athlete?.position?.abbreviation ?? node.athlete?.position?.name ?? node.athlete?.position;
      const posStr = typeof posRaw === "string" ? posRaw : null;
      const nn = normalizeName(name);
      if (AMBIGUOUS_NAMES.has(nn) && !posStr) return;
      out[playerKey(name, posStr)] = {
        status: rawStatus.trim(),
        detail: typeof detail === "string" && detail.trim() ? detail.trim() : null,
        severity: severityOf(rawStatus),
      };
      return;
    }
    for (const v of Object.values(node)) if (v && typeof v === "object") visit(v, depth + 1);
  };
  visit(json?.injuries ?? json);
  return out;
}

/** Looks a player up in the parsed injury map (position-aware for same-name players). */
export function lookupInjury(
  injuries: Record<string, InjuryInfo> | null | undefined,
  name: string,
  pos?: string | null
): InjuryInfo | null {
  return injuries?.[playerKey(name, pos)] ?? null;
}
