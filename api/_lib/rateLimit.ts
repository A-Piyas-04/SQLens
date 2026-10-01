import { createHash } from "node:crypto";

import { incrementCounter } from "./limitStore";

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

export type RateLimitDecision =
  | { ok: true }
  | { ok: false; reason: "burst" | "client"; retryAfterSeconds: number };

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function resolveLimits() {
  return {
    clientMax: parsePositiveInt(process.env.AI_RATE_LIMIT_MAX, 10),
    clientWindowMs: parsePositiveInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 60_000),
    burstMax: parsePositiveInt(process.env.AI_BURST_LIMIT_MAX, 3),
    burstWindowMs: parsePositiveInt(process.env.AI_BURST_LIMIT_WINDOW_MS, 10_000),
  };
}

function firstHeader(req: RequestLike, name: string): string | undefined {
  const raw = req.headers?.[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.split(",")[0]?.trim() || undefined;
}

/**
 * Forwarding headers are only trusted on Vercel, where the platform overwrites
 * them with the real client address. Elsewhere they are user-controlled.
 */
function resolveClientIp(req: RequestLike): string {
  if (process.env.VERCEL) {
    const forwarded =
      firstHeader(req, "x-vercel-forwarded-for") ??
      firstHeader(req, "x-real-ip") ??
      firstHeader(req, "x-forwarded-for");
    if (forwarded) return forwarded;
  }
  return req.socket?.remoteAddress || "unknown";
}

/** Hashed so raw client IPs are never written to the shared limit store. */
export function getClientIdentifier(req: RequestLike): string {
  return createHash("sha256").update(resolveClientIp(req)).digest("hex").slice(0, 32);
}

async function checkWindow(
  scope: string,
  clientId: string,
  max: number,
  windowMs: number,
  now: number
): Promise<{ ok: boolean; retryAfterSeconds: number }> {
  const windowIndex = Math.floor(now / windowMs);
  const key = `sqlens:ai:${scope}:${clientId}:${windowIndex}`;
  const count = await incrementCounter(key, windowMs + 1_000);
  const windowEnd = (windowIndex + 1) * windowMs;
  return {
    ok: count <= max,
    retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - now) / 1000)),
  };
}

/** Layered per-client limits: a short burst window plus the normal per-minute window. */
export async function enforceAiRateLimit(req: RequestLike): Promise<RateLimitDecision> {
  const limits = resolveLimits();
  const clientId = getClientIdentifier(req);
  const now = Date.now();

  const [burst, client] = await Promise.all([
    checkWindow("burst", clientId, limits.burstMax, limits.burstWindowMs, now),
    checkWindow("rate", clientId, limits.clientMax, limits.clientWindowMs, now),
  ]);

  if (!burst.ok) {
    return { ok: false, reason: "burst", retryAfterSeconds: burst.retryAfterSeconds };
  }
  if (!client.ok) {
    return { ok: false, reason: "client", retryAfterSeconds: client.retryAfterSeconds };
  }
  return { ok: true };
}
