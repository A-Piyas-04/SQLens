import type { VercelRequest, VercelResponse } from "@vercel/node";

import { buildSqlGuidancePrompt } from "./_lib/buildSqlGuidancePrompt";
import {
  AiModelUnavailableError,
  AiQuotaExceededError,
  generateWithGemini,
} from "./_lib/gemini";
import { enforceAiRateLimit } from "./_lib/rateLimit";
import {
  GUIDANCE_SQL_REJECTED_MESSAGE,
  sanitizeGuidance,
} from "./_lib/sanitizeGuidance";

const MAX_PROMPT_CHARS = 2_000;
const MAX_SCHEMA_CHARS = 4_000;

const QUOTA_ERROR_MESSAGE =
  "AI quota exceeded on all configured Gemini models. Please wait a bit or add another model via GEMINI_MODEL_FALLBACKS.";

const MODEL_ERROR_MESSAGE =
  "No configured Gemini model is available for this API key. Set GEMINI_MODEL and optionally GEMINI_MODEL_FALLBACKS.";

type ParsedBody = {
  prompt: string;
  schema?: string;
};

function parseBody(body: unknown): ParsedBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must include a non-empty string prompt.");
  }

  const record = body as Record<string, unknown>;

  if (typeof record.prompt !== "string") {
    throw new Error("Request body must include a non-empty string prompt.");
  }

  const prompt = record.prompt.trim();
  if (!prompt) {
    throw new Error("Request body must include a non-empty string prompt.");
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    throw new Error(
      `Prompt is too long. Maximum length is ${MAX_PROMPT_CHARS} characters.`
    );
  }

  let schema: string | undefined;
  if (record.schema !== undefined) {
    if (typeof record.schema !== "string") {
      throw new Error("schema must be a string when provided.");
    }
    schema = record.schema.trim().slice(0, MAX_SCHEMA_CHARS) || undefined;
  }

  return { prompt, schema };
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
    message.includes("schema must") ||
    message.includes("Prompt is too long") ||
    message.includes("invalid guidance") ||
    message === GUIDANCE_SQL_REJECTED_MESSAGE ||
    message.includes("must be a non-empty")
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
    const { prompt, schema } = parseBody(req.body);
    const raw = await generateWithGemini(
      buildSqlGuidancePrompt(prompt, schema)
    );
    const guidance = sanitizeGuidance(raw);
    json(res, 200, { guidance });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === GUIDANCE_SQL_REJECTED_MESSAGE
    ) {
      console.error("[api/sql-guidance] rejected runnable SQL in model output");
    } else {
      console.error("[api/sql-guidance]", error);
    }
    sendError(res, error, "Failed to get SQL guidance. Please try again.");
  }
}
