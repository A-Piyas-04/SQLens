import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildGenerationConfig } from "../gemini";
import { incrementCounter, resetMemoryCountersForTests } from "../limitStore";

describe("incrementCounter", () => {
  beforeEach(() => {
    resetMemoryCountersForTests();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("counts in memory when no shared store is configured", async () => {
    expect(await incrementCounter("k", 60_000)).toBe(1);
    expect(await incrementCounter("k", 60_000)).toBe(2);
  });

  it("uses the shared Redis REST pipeline when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token-123");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ result: "OK" }, { result: 7 }]), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await incrementCounter("sqlens:test", 10_000)).toBe(7);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://redis.example.com/pipeline");
    expect(init.headers.Authorization).toBe("Bearer token-123");
    expect(JSON.parse(init.body)).toEqual([
      ["SET", "sqlens:test", "0", "PX", "10000", "NX"],
      ["INCR", "sqlens:test"],
    ]);
  });

  it("falls back to memory when the shared store fails", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token-123");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    expect(await incrementCounter("k2", 60_000)).toBe(1);
    expect(await incrementCounter("k2", 60_000)).toBe(2);
  });
});

describe("buildGenerationConfig", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("always bounds output tokens", () => {
    expect(buildGenerationConfig("gemini-2.0-flash", false)).toEqual({ maxOutputTokens: 1024 });
  });

  it("honours GEMINI_MAX_OUTPUT_TOKENS and JSON mode", () => {
    vi.stubEnv("GEMINI_MAX_OUTPUT_TOKENS", "600");
    expect(buildGenerationConfig("gemini-2.0-flash-lite", true)).toEqual({
      maxOutputTokens: 600,
      responseMimeType: "application/json",
    });
  });

  it("disables thinking for 2.5 Flash models so the cap is not consumed", () => {
    expect(buildGenerationConfig("gemini-2.5-flash-lite", true)).toMatchObject({
      thinkingConfig: { thinkingBudget: 0 },
    });
  });
});
