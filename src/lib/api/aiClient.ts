const API_BASE = import.meta.env.VITE_API_URL?.trim()
  ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, "")
  : "";

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
