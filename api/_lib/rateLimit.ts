type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function readEnv(name: string): string | undefined {
  const maybeProcess = globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  };
  return maybeProcess.process?.env?.[name];
}

function resolveWindowMs(): number {
  return parsePositiveInt(readEnv("AI_RATE_LIMIT_WINDOW_MS"), 60_000);
}

function resolveMax(): number {
  return parsePositiveInt(readEnv("AI_RATE_LIMIT_MAX"), 15);
}

function getClientIp(req: {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const header = req.headers?.["x-forwarded-for"];
  const raw = Array.isArray(header) ? header[0] : header;
  const fromHeader = raw?.split(",")[0]?.trim();
  return fromHeader || req.socket?.remoteAddress || "unknown";
}

export function enforceAiRateLimit(req: {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const windowMs = resolveWindowMs();
  const max = resolveMax();
  const key = getClientIp(req);

  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  existing.count += 1;
  buckets.set(key, existing);

  if (existing.count <= max) {
    return { ok: true };
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000)
  );
  return { ok: false, retryAfterSeconds };
}
