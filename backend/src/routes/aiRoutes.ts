import { Router, type Response } from "express";

import { buildSqlGenerationPrompt } from "../prompts/sqlPrompt";
import { buildSqlGuidancePrompt } from "../prompts/sqlGuidancePrompt";
import {
  AiModelUnavailableError,
  AiQuotaExceededError,
  generateWithGemini,
} from "../services/gemini";
import {
  GUIDANCE_SQL_REJECTED_MESSAGE,
  sanitizeGuidance,
} from "../utils/sanitizeGuidance";
import { sanitizeGeneratedSql } from "../utils/sanitizeSql";

const router = Router();
const MAX_PROMPT_CHARS = 2_000;
const MAX_SCHEMA_CHARS = 4_000;

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

type GuidanceBody = {
  prompt: string;
  schema?: string;
};

function parseGuidanceBody(body: unknown): GuidanceBody {
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

const QUOTA_ERROR_MESSAGE =
  "AI quota exceeded on all configured Gemini models. Please wait a bit or add another model via GEMINI_MODEL_FALLBACKS.";

const MODEL_ERROR_MESSAGE =
  "No configured Gemini model is available for this API key. Set GEMINI_MODEL and optionally GEMINI_MODEL_FALLBACKS in backend/.env.";

function sendAiError(
  res: Response,
  error: unknown,
  fallback: string
): void {
  if (error instanceof AiQuotaExceededError) {
    res.status(429).json({ error: QUOTA_ERROR_MESSAGE });
    return;
  }

  if (error instanceof AiModelUnavailableError) {
    res.status(503).json({ error: MODEL_ERROR_MESSAGE });
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
    res.status(400).json({ error: message });
    return;
  }

  if (
    message.includes("empty SQL") ||
    message.includes("disallowed destructive")
  ) {
    res.status(400).json({ error: message });
    return;
  }

  if (message.includes("Missing GEMINI_API_KEY")) {
    res.status(503).json({
      error:
        "AI is not configured. Add GEMINI_API_KEY to backend/.env and restart Docker (docker compose up --build).",
    });
    return;
  }

  if (message.includes("Invalid GEMINI_API_KEY")) {
    res.status(503).json({
      error:
        "Gemini rejected the API key. Check GEMINI_API_KEY in backend/.env (Google AI Studio), then restart Docker.",
    });
    return;
  }

  if (message.includes("Cannot reach Google Gemini API")) {
    res.status(503).json({ error: message });
    return;
  }

  if (message.includes("Gemini API access denied")) {
    res.status(503).json({ error: message });
    return;
  }

  if (message === "AI request failed. Please try again.") {
    res.status(502).json({ error: message });
    return;
  }

  res.status(500).json({ error: message || fallback });
}

router.post("/generate-sql", async (req, res) => {
  try {
    const userPrompt = parsePrompt(req.body);
    const raw = await generateWithGemini(buildSqlGenerationPrompt(userPrompt));
    const sql = sanitizeGeneratedSql(raw);

    res.json({ sql });
  } catch (error) {
    sendAiError(res, error, "Failed to generate SQL. Please try again.");
  }
});

router.post("/sql-guidance", async (req, res) => {
  try {
    const { prompt, schema } = parseGuidanceBody(req.body);
    const raw = await generateWithGemini(buildSqlGuidancePrompt(prompt, schema), {
      jsonMode: true,
    });
    const guidance = sanitizeGuidance(raw);
    res.json({ guidance });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === GUIDANCE_SQL_REJECTED_MESSAGE
    ) {
      console.error("[api/sql-guidance] rejected runnable SQL in model output");
    }
    sendAiError(res, error, "Failed to get SQL guidance. Please try again.");
  }
});

export default router;
