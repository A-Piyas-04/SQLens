import type { SqlGuidance } from "./sqlGuidanceTypes";

function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") ?? "";
  if (!configured) return "";

  // Docker-internal hostname — not resolvable from the user's browser.
  if (/^https?:\/\/backend(:\d+)?\/?$/i.test(configured)) {
    return "";
  }

  if (import.meta.env.PROD) {
    const isLocalhost =
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configured);
    if (isLocalhost) return "";
  }

  return configured;
}

function wrapFetchError(err: unknown): Error {
  if (err instanceof TypeError) {
    return new Error(
      "Cannot reach the SQL assistant API. If you use Docker, restart with docker compose up --build. Otherwise ensure the backend is running on port 3001."
    );
  }
  return err instanceof Error ? err : new Error("Request failed.");
}

const API_BASE = resolveApiBase();

/** Mirrors the server's AI field limits so normal requests are never rejected. */
const AI_REQUEST_LIMITS = {
  prompt: 2_000,
  schema: 4_000,
  problemTitle: 200,
  problemDescription: 1_000,
  lastError: 500,
  topicCount: 20,
  topicChars: 80,
  hintCount: 10,
  hintChars: 500,
} as const;

export const MAX_AI_PROMPT_CHARS = AI_REQUEST_LIMITS.prompt;

function clampText(value: string, maxChars: number): string {
  return value.trim().slice(0, maxChars);
}

type GuidanceResponse = {
  guidance: SqlGuidance;
};

type ErrorResponse = {
  error?: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T & ErrorResponse> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as T & ErrorResponse;
  } catch {
    const snippet = raw.trim().slice(0, 120);
    throw new Error(snippet || `Request failed (${response.status})`);
  }
}

export async function requestSqlGuidance(
  prompt: string,
  schema?: string
): Promise<SqlGuidance> {
  const body: { prompt: string; schema?: string } = {
    prompt: clampText(prompt, AI_REQUEST_LIMITS.prompt),
  };
  if (schema?.trim()) {
    body.schema = clampText(schema, AI_REQUEST_LIMITS.schema);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/sql-guidance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw wrapFetchError(err);
  }

  const data = await parseJsonResponse<GuidanceResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  if (!data.guidance?.summary?.trim()) {
    throw new Error("Server returned empty guidance.");
  }

  return data.guidance;
}

export type Sql50CoachingRequest = {
  problemTitle: string;
  problemDescription: string;
  topics: string[];
  userPrompt: string;
  userError?: string;
  hintsUsed: number;
  unlockedHints: string[];
  schema?: string;
};

const RUNNABLE_SQL_PATTERN =
  /\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|WITH\s+\w+\s+AS)\b/i;

function clientSanitizeGuidance(guidance: SqlGuidance): SqlGuidance {
  const combined = JSON.stringify(guidance);
  if (RUNNABLE_SQL_PATTERN.test(combined)) {
    throw new Error(
      "Coaching response contained SQL-like content and was blocked. Try rephrasing your question."
    );
  }
  return guidance;
}

function clampCoachingRequest(body: Sql50CoachingRequest): Sql50CoachingRequest {
  const userError = body.userError ? clampText(body.userError, AI_REQUEST_LIMITS.lastError) : "";
  const schema = body.schema ? clampText(body.schema, AI_REQUEST_LIMITS.schema) : "";
  return {
    problemTitle: clampText(body.problemTitle, AI_REQUEST_LIMITS.problemTitle),
    problemDescription: clampText(body.problemDescription, AI_REQUEST_LIMITS.problemDescription),
    topics: body.topics
      .slice(0, AI_REQUEST_LIMITS.topicCount)
      .map((topic) => topic.slice(0, AI_REQUEST_LIMITS.topicChars)),
    userPrompt: clampText(body.userPrompt, AI_REQUEST_LIMITS.prompt),
    userError: userError || undefined,
    hintsUsed: body.hintsUsed,
    unlockedHints: body.unlockedHints
      .slice(0, AI_REQUEST_LIMITS.hintCount)
      .map((hint) => hint.slice(0, AI_REQUEST_LIMITS.hintChars)),
    schema: schema || undefined,
  };
}

export async function requestSql50Coaching(
  body: Sql50CoachingRequest
): Promise<SqlGuidance> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/sql50-coaching`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clampCoachingRequest(body)),
    });
  } catch (err) {
    throw wrapFetchError(err);
  }

  const data = await parseJsonResponse<GuidanceResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  if (!data.guidance?.summary?.trim()) {
    throw new Error("Server returned empty coaching.");
  }

  return clientSanitizeGuidance(data.guidance);
}

/** @deprecated Use requestSqlGuidance — guidance-only assistant replaces direct SQL generation. */
export async function generateSql(prompt: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/generate-sql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await parseJsonResponse<{ sql: string }>(response);

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  if (!data.sql?.trim()) {
    throw new Error("Server returned empty SQL.");
  }

  return data.sql;
}
