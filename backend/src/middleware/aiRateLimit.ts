import rateLimit from "express-rate-limit";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

const windowMs = parsePositiveInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 60_000);
const max = parsePositiveInt(process.env.AI_RATE_LIMIT_MAX, 15);

export const aiRateLimit = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many AI requests from this IP. Please wait before trying again.",
  },
});
