import { incrementCounter } from "./limitStore";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_KEY_TTL_MS = 26 * 60 * 60 * 1000;

export type DailyQuotaDecision =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

function resolveDailyLimit(): number {
  const parsed = Number(process.env.AI_DAILY_REQUEST_LIMIT);
  if (!Number.isFinite(parsed) || parsed <= 0) return 5_000;
  return Math.floor(parsed);
}

function utcDateKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Counts one Gemini-bound request against the deployment-wide daily ceiling (UTC day). */
export async function consumeDailyAiQuota(now: number = Date.now()): Promise<DailyQuotaDecision> {
  const key = `sqlens:gemini:daily:${utcDateKey(now)}`;
  const count = await incrementCounter(key, DAILY_KEY_TTL_MS);

  if (count <= resolveDailyLimit()) {
    return { ok: true };
  }

  const nextUtcMidnight = (Math.floor(now / DAY_MS) + 1) * DAY_MS;
  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((nextUtcMidnight - now) / 1000)),
  };
}
