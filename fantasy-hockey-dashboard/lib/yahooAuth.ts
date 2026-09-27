// Yahoo OAuth 2.0 token management — server-only. Single-user app, so
// tokens live under one fixed Redis key rather than per-session storage.
//
// KNOWN RISK: built against documented Yahoo OAuth2 patterns but never
// tested live against Yahoo's actual endpoints from this environment
// (no network path to api.login.yahoo.com in the build sandbox). If the
// login flow fails, check here first — the token endpoint's exact
// request shape is the most likely culprit, same class of issue as the
// NHL boxscore endpoint needed fixing after its first deploy.

import { redis } from "./redis";

const TOKEN_KEY = "yahoo:tokens";
const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

type StoredTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
};

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://fantasy-hockey-dashboard-ten.vercel.app";
  return `${base}/api/auth/callback`;
}

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.YAHOO_CLIENT_ID ?? "",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    language: "en-us",
    scope: "fspt-r",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function requestTokens(body: Record<string, string>): Promise<StoredTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.YAHOO_CLIENT_ID ?? "",
      client_secret: process.env.YAHOO_CLIENT_SECRET ?? "",
      ...body,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Yahoo token request failed: ${res.status} ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  if (!json.access_token || !json.refresh_token) {
    throw new Error(`Yahoo token response missing tokens: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (Number(json.expires_in) || 3600) * 1000,
  };
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const tokens = await requestTokens({
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(),
    code,
  });
  await saveTokens(tokens);
}

async function refreshTokens(refreshToken: string): Promise<StoredTokens> {
  return requestTokens({
    grant_type: "refresh_token",
    redirect_uri: getRedirectUri(),
    refresh_token: refreshToken,
  });
}

async function saveTokens(tokens: StoredTokens): Promise<void> {
  if (!redis) throw new Error("Roster database isn't connected — can't store Yahoo tokens.");
  await redis.set(TOKEN_KEY, tokens);
}

async function loadTokens(): Promise<StoredTokens | null> {
  if (!redis) return null;
  return (await redis.get<StoredTokens>(TOKEN_KEY)) ?? null;
}

export async function isYahooConnected(): Promise<boolean> {
  const tokens = await loadTokens();
  return !!tokens;
}

/** Returns a valid access token, refreshing first if it's expired (or
 * close to it). Throws if never connected. */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error("Not connected to Yahoo yet — visit /api/auth/login first.");

  // Refresh a little early (60s buffer) rather than right at expiry.
  if (Date.now() > tokens.expires_at - 60_000) {
    const refreshed = await refreshTokens(tokens.refresh_token);
    await saveTokens(refreshed);
    return refreshed.access_token;
  }
  return tokens.access_token;
}

export async function disconnectYahoo(): Promise<void> {
  if (!redis) return;
  await redis.del(TOKEN_KEY);
}
