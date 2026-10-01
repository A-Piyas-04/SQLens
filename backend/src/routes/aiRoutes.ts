import { Router, type Request, type Response } from "express";

import { buildSqlGenerationPrompt } from "../prompts/sqlPrompt";
import { buildSqlGuidancePrompt } from "../prompts/sqlGuidancePrompt";
import { buildSql50CoachingPrompt } from "../prompts/sql50CoachingPrompt";
import { generateWithGemini } from "../services/gemini";
import { consumeDailyAiQuota } from "../utils/dailyAiQuota";
import {
  AiResponseFormatError,
  resolveSafeAiError,
  SAFE_AI_MESSAGES,
} from "../utils/safeApiError";
import {
  GUIDANCE_SQL_REJECTED_MESSAGE,
  sanitizeGuidance,
} from "../utils/sanitizeGuidance";
import { sanitizeGeneratedSql } from "../utils/sanitizeSql";
import {
  validateCoachingRequest,
  validateGuidanceRequest,
  validatePromptRequest,
} from "../utils/validateAiRequest";

const router = Router();

/** Legacy direct-SQL endpoint; the UI uses guidance routes, so production exposure is opt-in. */
function isLegacyGenerateSqlEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_LEGACY_GENERATE_SQL === "true"
  );
}

/** Model output that fails validation is a provider problem, not a client error. */
function sanitizeGuidanceOutput(raw: string) {
  try {
    return sanitizeGuidance(raw);
  } catch (error) {
    if (error instanceof Error && error.message === GUIDANCE_SQL_REJECTED_MESSAGE) {
      throw error;
    }
    throw new AiResponseFormatError();
  }
}

type AiRouteOptions<T> = {
  route: string;
  parse: (body: unknown) => T;
  measure: (input: T) => { promptChars: number; schemaChars: number };
  execute: (input: T) => Promise<Record<string, unknown>>;
};

/** Metadata only — never prompts, schemas, SQL, or credentials. */
function logAiRequest(entry: Record<string, unknown>): void {
  const line = JSON.stringify(entry);
  if (typeof entry.status === "number" && entry.status >= 500) {
    console.error("[ai]", line);
  } else {
    console.info("[ai]", line);
  }
}

function aiRoute<T>(options: AiRouteOptions<T>) {
  return async (req: Request, res: Response): Promise<void> => {
    const startedAt = Date.now();
    const log: Record<string, unknown> = { route: options.route };
    res.setHeader("Cache-Control", "no-store");

    try {
      const input = options.parse(req.body);
      Object.assign(log, options.measure(input));

      const dailyQuota = consumeDailyAiQuota();
      if (!dailyQuota.ok) {
        res.setHeader("Retry-After", String(dailyQuota.retryAfterSeconds));
        res.status(429).json({ error: SAFE_AI_MESSAGES.dailyLimit });
        logAiRequest({ ...log, status: 429, decision: "daily_limit", durationMs: Date.now() - startedAt });
        return;
      }

      const payload = await options.execute(input);
      res.json(payload);
      logAiRequest({ ...log, status: 200, decision: "allowed", durationMs: Date.now() - startedAt });
    } catch (error) {
      const safe = resolveSafeAiError(error);
      if (safe.status >= 500) {
        console.error(
          `[ai] ${options.route} ${safe.category}:`,
          error instanceof Error ? `${error.name}: ${error.message.slice(0, 200)}` : "non-error thrown"
        );
      }
      res.status(safe.status).json({ error: safe.message });
      logAiRequest({
        ...log,
        status: safe.status,
        errorCategory: safe.category,
        durationMs: Date.now() - startedAt,
      });
    }
  };
}

const generateSqlHandler = aiRoute({
  route: "generate-sql",
  parse: validatePromptRequest,
  measure: ({ prompt }) => ({ promptChars: prompt.length, schemaChars: 0 }),
  execute: async ({ prompt }) => {
    const raw = await generateWithGemini(buildSqlGenerationPrompt(prompt));
    return { sql: sanitizeGeneratedSql(raw) };
  },
});

router.post("/generate-sql", async (req, res) => {
  if (!isLegacyGenerateSqlEnabled()) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await generateSqlHandler(req, res);
});

router.post(
  "/sql-guidance",
  aiRoute({
    route: "sql-guidance",
    parse: validateGuidanceRequest,
    measure: ({ prompt, schema }) => ({
      promptChars: prompt.length,
      schemaChars: schema?.length ?? 0,
    }),
    execute: async ({ prompt, schema }) => {
      const raw = await generateWithGemini(buildSqlGuidancePrompt(prompt, schema), {
        jsonMode: true,
      });
      return { guidance: sanitizeGuidanceOutput(raw) };
    },
  })
);

router.post(
  "/sql50-coaching",
  aiRoute({
    route: "sql50-coaching",
    parse: validateCoachingRequest,
    measure: (ctx) => ({
      promptChars: ctx.userPrompt.length,
      schemaChars: ctx.schema?.length ?? 0,
    }),
    execute: async (ctx) => {
      const raw = await generateWithGemini(buildSql50CoachingPrompt(ctx), {
        jsonMode: true,
      });
      return { guidance: sanitizeGuidanceOutput(raw) };
    },
  })
);

export default router;
