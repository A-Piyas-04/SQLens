type MemoryEntry = {
  count: number;
  expiresAt: number;
};

const memoryCounters = new Map<string, MemoryEntry>();
const MEMORY_PRUNE_THRESHOLD = 5_000;
const REDIS_TIMEOUT_MS = 1_500;

let warnedMissingStore = false;
let warnedStoreFailure = false;

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function resolveRedisConfig(): { url: string; token: string } | null {
  const url = readEnv("UPSTASH_REDIS_REST_URL") ?? readEnv("KV_REST_API_URL");
  const token = readEnv("UPSTASH_REDIS_REST_TOKEN") ?? readEnv("KV_REST_API_TOKEN");
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export function isSharedLimitStoreConfigured(): boolean {
  return resolveRedisConfig() !== null;
}

function pruneMemoryCounters(now: number): void {
  if (memoryCounters.size < MEMORY_PRUNE_THRESHOLD) return;
  for (const [key, entry] of memoryCounters) {
    if (entry.expiresAt <= now) memoryCounters.delete(key);
  }
}

function incrementInMemory(key: string, ttlMs: number): number {
  const now = Date.now();
  pruneMemoryCounters(now);

  const existing = memoryCounters.get(key);
  if (!existing || existing.expiresAt <= now) {
    memoryCounters.set(key, { count: 1, expiresAt: now + ttlMs });
    return 1;
  }

  existing.count += 1;
  return existing.count;
}

async function incrementInRedis(
  config: { url: string; token: string },
  key: string,
  ttlMs: number
): Promise<number> {
  // SET NX seeds the TTL only once per window; INCR keeps the existing TTL.
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["SET", key, "0", "PX", String(ttlMs), "NX"],
      ["INCR", key],
    ]),
    signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`limit store responded with ${response.status}`);
  }

  const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  const incr = results[1];
  const count = Number(incr?.result);
  if (incr?.error || !Number.isFinite(count)) {
    throw new Error("limit store returned an invalid counter");
  }
  return count;
}

/**
 * Atomically increments a windowed counter and returns the new value.
 * Uses shared Redis (Upstash / Vercel KV REST) when configured; otherwise, or if
 * the shared store fails, falls back to a per-instance in-memory counter.
 */
export async function incrementCounter(key: string, ttlMs: number): Promise<number> {
  const config = resolveRedisConfig();

  if (!config) {
    if (!warnedMissingStore && process.env.NODE_ENV === "production") {
      warnedMissingStore = true;
      console.warn(
        "[limits] UPSTASH_REDIS_REST_URL/TOKEN not configured — AI limits are per-instance only."
      );
    }
    return incrementInMemory(key, ttlMs);
  }

  try {
    return await incrementInRedis(config, key, ttlMs);
  } catch (error) {
    if (!warnedStoreFailure) {
      warnedStoreFailure = true;
      console.warn(
        "[limits] shared limit store unavailable, using per-instance fallback:",
        error instanceof Error ? error.message : "unknown error"
      );
    }
    return incrementInMemory(key, ttlMs);
  }
}

export function resetMemoryCountersForTests(): void {
  memoryCounters.clear();
}
