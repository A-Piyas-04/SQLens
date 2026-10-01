const DAY_MS = 24 * 60 * 60 * 1000;

// The Express backend is a single long-lived process, so an in-memory counter is global.
let currentDay = "";
let currentCount = 0;

export type DailyQuotaDecision =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

function resolveDailyLimit(): number {
  const parsed = Number(process.env.AI_DAILY_REQUEST_LIMIT);
  if (!Number.isFinite(parsed) || parsed <= 0) return 5_000;
  return Math.floor(parsed);
}

/** Counts one Gemini-bound request against the backend-wide daily ceiling (UTC day). */
export function consumeDailyAiQuota(now: number = Date.now()): DailyQuotaDecision {
  const day = new Date(now).toISOString().slice(0, 10);
  if (day !== currentDay) {
    currentDay = day;
    currentCount = 0;
  }

  currentCount += 1;
  if (currentCount <= resolveDailyLimit()) {
    return { ok: true };
  }

  const nextUtcMidnight = (Math.floor(now / DAY_MS) + 1) * DAY_MS;
  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((nextUtcMidnight - now) / 1000)),
  };
}
