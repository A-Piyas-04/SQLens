import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

import { SAFE_AI_MESSAGES } from "../utils/safeApiError";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

const limiterDefaults = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: SAFE_AI_MESSAGES.rateLimited },
} as const;

const burstLimit = rateLimit({
  ...limiterDefaults,
  windowMs: parsePositiveInt(process.env.AI_BURST_LIMIT_WINDOW_MS, 10_000),
  limit: parsePositiveInt(process.env.AI_BURST_LIMIT_MAX, 3),
});

const clientLimit = rateLimit({
  ...limiterDefaults,
  windowMs: parsePositiveInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 60_000),
  limit: parsePositiveInt(process.env.AI_RATE_LIMIT_MAX, 10),
});

/** Layered per-client limits: short burst window, then the normal per-minute window. */
export const aiRateLimit: RequestHandler[] = [burstLimit, clientLimit];
