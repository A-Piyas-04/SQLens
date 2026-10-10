import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

vi.mock("../gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../gemini")>();
  return { ...actual, generateWithGemini: vi.fn() };
});

import { generateWithGemini } from "../gemini";
import { resetMemoryCountersForTests } from "../limitStore";
import { SAFE_AI_MESSAGES } from "../safeApiError";
import guidanceHandler from "../../sql-guidance";
import coachingHandler from "../../sql50-coaching";
import generateSqlHandler from "../../generate-sql";

const VALID_GUIDANCE = JSON.stringify({
  summary: "Link students to enrollments, then filter by department.",
  problemBreakdown: ["Find the department table."],
  techniques: [
    { name: "INNER JOIN", whenToUse: "When both sides must match." },
    { name: "WHERE", whenToUse: "To filter by department." },
  ],
  tablesAndColumns: ["students.department_id"],
  pitfalls: ["Forgetting the bridge table."],
});

type MockResponse = VercelResponse & {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

function createResponse(): MockResponse {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: "",
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    end(payload?: string) {
      res.body = payload ?? "";
      return res;
    },
  };
  return res as unknown as MockResponse;
}

function createRequest(body: unknown, ip = "203.0.113.10"): VercelRequest {
  return {
    method: "POST",
    headers: {},
    body,
    socket: { remoteAddress: ip },
  } as unknown as VercelRequest;
}

async function call(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  req: VercelRequest
) {
  const res = createResponse();
  await handler(req, res);
  return { status: res.statusCode, headers: res.headers, json: JSON.parse(res.body || "{}") };
}

const mockedGenerate = vi.mocked(generateWithGemini);

describe("AI feature flag", () => {
  beforeEach(() => {
    resetMemoryCountersForTests();
    mockedGenerate.mockReset();
    mockedGenerate.mockResolvedValue(VALID_GUIDANCE);
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([undefined, "", "false", "TRUE", "1", "yes"])(
    "returns 404 from every AI route when AI_FEATURES_ENABLED=%s",
    async (flag) => {
      if (flag === undefined) delete process.env.AI_FEATURES_ENABLED;
      else vi.stubEnv("AI_FEATURES_ENABLED", flag);
      vi.stubEnv("ENABLE_LEGACY_GENERATE_SQL", "true");

      for (const handler of [guidanceHandler, coachingHandler, generateSqlHandler]) {
        const result = await call(handler, createRequest({ prompt: "list students" }));
        expect(result.status).toBe(404);
        expect(result.json).toEqual({ error: "Not found" });
      }
      expect(mockedGenerate).not.toHaveBeenCalled();
    }
  );
});

describe("AI route protection", () => {
  beforeEach(() => {
    vi.stubEnv("AI_FEATURES_ENABLED", "true");
    resetMemoryCountersForTests();
    mockedGenerate.mockReset();
    mockedGenerate.mockResolvedValue(VALID_GUIDANCE);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("keeps the success response shape for normal requests", async () => {
    const result = await call(guidanceHandler, createRequest({ prompt: "list students" }));
    expect(result.status).toBe(200);
    expect(result.json.guidance.summary).toContain("students");
    expect(result.headers["cache-control"]).toBe("no-store");
  });

  it("rejects oversized prompts with 400 before calling Gemini", async () => {
    const result = await call(guidanceHandler, createRequest({ prompt: "a".repeat(2_001) }));
    expect(result.status).toBe(400);
    expect(typeof result.json.error).toBe("string");
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After once the burst limit is exceeded", async () => {
    vi.stubEnv("AI_BURST_LIMIT_MAX", "2");
    const req = () => createRequest({ prompt: "list students" }, "198.51.100.7");

    expect((await call(guidanceHandler, req())).status).toBe(200);
    expect((await call(guidanceHandler, req())).status).toBe(200);
    const limited = await call(guidanceHandler, req());

    expect(limited.status).toBe(429);
    expect(limited.json).toEqual({ error: SAFE_AI_MESSAGES.rateLimited });
    expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
    expect(mockedGenerate).toHaveBeenCalledTimes(2);
  });

  it("blocks the Gemini call once the global daily limit is reached", async () => {
    vi.stubEnv("AI_DAILY_REQUEST_LIMIT", "1");

    expect((await call(guidanceHandler, createRequest({ prompt: "a" }, "192.0.2.1"))).status).toBe(200);
    const blocked = await call(guidanceHandler, createRequest({ prompt: "b" }, "192.0.2.2"));

    expect(blocked.status).toBe(429);
    expect(blocked.json).toEqual({ error: SAFE_AI_MESSAGES.dailyLimit });
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
  });

  it("never leaks unexpected exception details", async () => {
    mockedGenerate.mockRejectedValue(new Error("boom at /var/task/secret.js:12 key=abc"));
    const result = await call(guidanceHandler, createRequest({ prompt: "list students" }));

    expect(result.status).toBe(500);
    expect(result.json).toEqual({ error: SAFE_AI_MESSAGES.failed });
  });

  it("hides malformed model output behind a generic 502", async () => {
    mockedGenerate.mockResolvedValue("not json at all");
    const result = await call(guidanceHandler, createRequest({ prompt: "list students" }));

    expect(result.status).toBe(502);
    expect(result.json).toEqual({ error: SAFE_AI_MESSAGES.badModelOutput });
  });

  it("rejects non-POST methods", async () => {
    const req = { ...createRequest({}), method: "GET" } as VercelRequest;
    expect((await call(guidanceHandler, req)).status).toBe(405);
  });

  it("hides the legacy generate-sql route in production unless enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await call(generateSqlHandler, createRequest({ prompt: "x" }))).status).toBe(404);

    vi.stubEnv("ENABLE_LEGACY_GENERATE_SQL", "true");
    mockedGenerate.mockResolvedValue("SELECT 1;");
    const enabled = await call(generateSqlHandler, createRequest({ prompt: "x" }));
    expect(enabled.status).toBe(200);
    expect(enabled.json).toEqual({ sql: "SELECT 1;" });
  });
});
