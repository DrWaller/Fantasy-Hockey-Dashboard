import { Redis } from "@upstash/redis";

// The Vercel Marketplace's Upstash Redis integration has injected env vars
// under both names at different points (KV_REST_API_* for Vercel-KV
// backward compatibility, UPSTASH_REDIS_REST_* natively) — check both so
// this isn't broken by whichever one actually shows up.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Null (not thrown) when unconfigured, so the rest of the app can degrade
// gracefully to read-only baseline rosters instead of a hard crash if the
// database integration hasn't been added to the Vercel project yet.
export const redis = url && token ? new Redis({ url, token }) : null;
