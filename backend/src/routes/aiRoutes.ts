import { Router, type Response } from "express";

import { buildSqlGenerationPrompt } from "../prompts/sqlPrompt";
import {
  AiModelUnavailableError,
  AiQuotaExceededError,
  generateWithGemini,
} from "../services/gemini";
import { sanitizeGeneratedSql } from "../utils/sanitizeSql";

const router = Router();

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

  return prompt;
}

const QUOTA_ERROR_MESSAGE =
  "AI quota exceeded. Please wait a bit or switch to another free model/API key.";

const MODEL_ERROR_MESSAGE =
  "AI model is unavailable for this API key. Set GEMINI_MODEL in backend/.env (e.g. gemini-2.5-flash-lite).";

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

  if (message.includes("prompt")) {
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

  res.status(500).json({ error: fallback });
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

export default router;
