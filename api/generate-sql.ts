import type { VercelRequest, VercelResponse } from "@vercel/node";

import { buildSqlGenerationPrompt } from "./_lib/buildSqlPrompt";
import {
  AiModelUnavailableError,
  AiQuotaExceededError,
  generateWithGemini,
} from "./_lib/gemini";
import { enforceAiRateLimit } from "./_lib/rateLimit";
import { sanitizeGeneratedSql } from "./_lib/sanitizeSql";

const MAX_PROMPT_CHARS = 2_000;

const QUOTA_ERROR_MESSAGE =
  "AI quota exceeded on all configured Gemini models. Please wait a bit or add another model via GEMINI_MODEL_FALLBACKS.";

const MODEL_ERROR_MESSAGE =
  "No configured Gemini model is available for this API key. Set GEMINI_MODEL and optionally GEMINI_MODEL_FALLBACKS.";

function parsePrompt(body: unknown): string {
  if (
    typeof body !== "object" ||
    body === null ||
    !("prompt" in body) ||
    typeof (body as { prompt: unknown }).prompt !== "string"
  ) {
    throw new Error("Request body must include a non-empty string prompt.");
  }

  const prompt = (body as { prompt: string }).prompt.trim();
  if (!prompt) {
    throw new Error("Request body must include a non-empty string prompt.");
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    throw new Error(
      `Prompt is too long. Maximum length is ${MAX_PROMPT_CHARS} characters.`
    );
  }

  return prompt;
}

function json(res: VercelResponse, status: number, payload: Record<string, unknown>) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function sendError(
  res: VercelResponse,
  error: unknown,
  fallback: string
): void {
  if (error instanceof AiQuotaExceededError) {
    json(res, 429, { error: QUOTA_ERROR_MESSAGE });
    return;
  }

  if (error instanceof AiModelUnavailableError) {
    json(res, 503, { error: MODEL_ERROR_MESSAGE });
    return;
  }

  const message = error instanceof Error ? error.message : fallback;

  if (
    message.includes("prompt") ||
    message.includes("empty SQL") ||
    message.includes("disallowed destructive") ||
    message.includes("Prompt is too long")
  ) {
    json(res, 400, { error: message });
    return;
  }

  if (message.includes("GEMINI_API_KEY")) {
    json(res, 500, { error: "Server is missing AI configuration." });
    return;
  }

  json(res, 500, { error: fallback });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  const rateLimit = enforceAiRateLimit(req);
  if (!rateLimit.ok) {
    res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
    json(res, 429, {
      error: "Too many AI requests from this IP. Please wait and try again.",
    });
    return;
  }

  try {
    const userPrompt = parsePrompt(req.body);
    const raw = await generateWithGemini(buildSqlGenerationPrompt(userPrompt));
    const sql = sanitizeGeneratedSql(raw);
    json(res, 200, { sql });
  } catch (error) {
    console.error("[api/generate-sql]", error);
    sendError(res, error, "Failed to generate SQL. Please try again.");
  }
}
