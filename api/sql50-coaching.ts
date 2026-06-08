import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  buildSql50CoachingPrompt,
  type Sql50CoachingContext,
} from "./_lib/buildSql50CoachingPrompt";
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

const MAX_SCHEMA_CHARS = 4_000;

const QUOTA_ERROR_MESSAGE =
  "AI quota exceeded on all configured Gemini models. Please wait a bit or add another model via GEMINI_MODEL_FALLBACKS.";

const MODEL_ERROR_MESSAGE =
  "No configured Gemini model is available for this API key. Set GEMINI_MODEL and optionally GEMINI_MODEL_FALLBACKS.";

function parseBody(body: unknown): Sql50CoachingContext {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const record = body as Record<string, unknown>;

  const requiredStrings = ["problemTitle", "problemDescription", "userPrompt"] as const;
  for (const key of requiredStrings) {
    if (typeof record[key] !== "string" || !record[key].trim()) {
      throw new Error(`Request body must include a non-empty string ${key}.`);
    }
  }

  const topics = Array.isArray(record.topics)
    ? record.topics.filter((t): t is string => typeof t === "string")
    : [];

  const unlockedHints = Array.isArray(record.unlockedHints)
    ? record.unlockedHints.filter((h): h is string => typeof h === "string")
    : [];

  let schema: string | undefined;
  if (record.schema !== undefined) {
    if (typeof record.schema !== "string") {
      throw new Error("schema must be a string when provided.");
    }
    schema = record.schema.trim().slice(0, MAX_SCHEMA_CHARS) || undefined;
  }

  const hintsUsed =
    typeof record.hintsUsed === "number" && record.hintsUsed >= 0
      ? record.hintsUsed
      : 0;

  return {
    problemTitle: (record.problemTitle as string).trim(),
    problemDescription: (record.problemDescription as string).trim(),
    topics,
    userPrompt: (record.userPrompt as string).trim(),
    userError:
      typeof record.userError === "string"
        ? record.userError.trim() || undefined
        : undefined,
    hintsUsed,
    unlockedHints,
    schema,
  };
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
    message.includes("Request body") ||
    message.includes("schema must") ||
    message.includes("invalid guidance") ||
    message === GUIDANCE_SQL_REJECTED_MESSAGE
  ) {
    json(res, 400, { error: message });
    return;
  }

  if (message.includes("Missing GEMINI_API_KEY")) {
    json(res, 503, {
      error:
        "AI is not configured. Set GEMINI_API_KEY in backend/.env or Vercel env vars.",
    });
    return;
  }

  json(res, 500, { error: message || fallback });
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
    const ctx = parseBody(req.body);
    const raw = await generateWithGemini(buildSql50CoachingPrompt(ctx), {
      jsonMode: true,
    });
    const guidance = sanitizeGuidance(raw);
    json(res, 200, { guidance });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === GUIDANCE_SQL_REJECTED_MESSAGE
    ) {
      console.error("[api/sql50-coaching] rejected runnable SQL in model output");
    } else {
      console.error("[api/sql50-coaching]", error);
    }
    sendError(res, error, "Failed to get coaching. Please try again.");
  }
}
