function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") ?? "";
  if (!configured) return "";

  // Vite bakes VITE_* at build time. If localhost was set in Vercel env by mistake,
  // ignore it in production so the app calls same-origin /api/generate-sql.
  if (import.meta.env.PROD) {
    const isLocalhost =
      /^https?:\/\/(localhost|127\.0\.0\.1|backend)(:\d+)?\/?$/i.test(configured);
    if (isLocalhost) return "";
  }

  return configured;
}

const API_BASE = resolveApiBase();

type GenerateResponse = {
  sql: string;
};

type ErrorResponse = {
  error?: string;
};

export async function generateSql(prompt: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/generate-sql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = (await response.json()) as GenerateResponse & ErrorResponse;

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  if (!data.sql?.trim()) {
    throw new Error("Server returned empty SQL.");
  }

  return data.sql;
}
