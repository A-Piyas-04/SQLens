import type { SqlGuidance } from "./sqlGuidanceTypes";

function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") ?? "";
  if (!configured) return "";

  if (import.meta.env.PROD) {
    const isLocalhost =
      /^https?:\/\/(localhost|127\.0\.0\.1|backend)(:\d+)?\/?$/i.test(configured);
    if (isLocalhost) return "";
  }

  return configured;
}

const API_BASE = resolveApiBase();

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
  const body: { prompt: string; schema?: string } = { prompt };
  if (schema?.trim()) {
    body.schema = schema.trim();
  }

  const response = await fetch(`${API_BASE}/api/sql-guidance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await parseJsonResponse<GuidanceResponse>(response);

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  if (!data.guidance?.summary?.trim()) {
    throw new Error("Server returned empty guidance.");
  }

  return data.guidance;
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
