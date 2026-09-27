import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/yahooAuth";

const BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

async function probe(path: string, token: string) {
  const url = `${BASE}/${path}${path.includes("?") ? "&" : "?"}format=json`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const text = await res.text();
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => (headers[k] = v));
  return { path, status: res.status, ok: res.ok, headers, body: text.slice(0, 500) };
}

// Tests a spread of endpoints with different scope/permission requirements
// so we can see exactly which layer is blocked, rather than guessing from
// one failing call: a fully public resource (no user scope at all), a
// generic OpenID-style user resource, and the actual Fantasy-scoped
// resource we need.
export async function GET() {
  try {
    const token = await getValidAccessToken();
    const results = await Promise.all([
      probe("game/nhl", token), // public game metadata — needs no fantasy scope
      probe("users;use_login=1", token), // basic authenticated user info
      probe("users;use_login=1/games;game_codes=nhl/leagues", token), // the actual failing call
    ]);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Diagnose failed" }, { status: 502 });
  }
}
