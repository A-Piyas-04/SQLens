import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { consumeDailyAiQuota } from "./globalAiQuota";
import { enforceAiRateLimit } from "./rateLimit";
import {
  AiResponseFormatError,
  resolveSafeAiError,
  SAFE_AI_MESSAGES,
} from "./safeApiError";
import { GUIDANCE_SQL_REJECTED_MESSAGE, sanitizeGuidance } from "./sanitizeGuidance";
import type { SqlGuidance } from "./sqlGuidanceTypes";
import { assertBodyWithinBudget } from "./validateAiRequest";

type InputSize = {
  promptChars: number;
  schemaChars: number;
};

type AiRouteOptions<T> = {
  route: string;
  parse: (body: unknown) => T;
  measure: (input: T) => InputSize;
  execute: (input: T) => Promise<Record<string, unknown>>;
};

type AiRequestLog = {
  requestId: string;
  route: string;
  status?: number;
  durationMs?: number;
  promptChars?: number;
  schemaChars?: number;
  decision?: string;
  errorCategory?: string;
};

function json(res: VercelResponse, status: number, payload: Record<string, unknown>) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

/** Metadata only — never prompts, schemas, SQL, or credentials. */
function writeLog(entry: AiRequestLog, startedAt: number): void {
  const line = JSON.stringify({ ...entry, durationMs: Date.now() - startedAt });
  if ((entry.status ?? 500) >= 500) {
    console.error("[ai]", line);
  } else {
    console.info("[ai]", line);
  }
}

/** Model output that fails validation is a provider problem, not a client error. */
export function sanitizeGuidanceOutput(raw: string): SqlGuidance {
  try {
    return sanitizeGuidance(raw);
  } catch (error) {
    if (error instanceof Error && error.message === GUIDANCE_SQL_REJECTED_MESSAGE) {
      throw error;
    }
    throw new AiResponseFormatError();
  }
}

/**
 * Shared protection pipeline for AI routes:
 * body budget → validation → per-client limits → global daily quota → route logic.
 */
export async function handleAiRoute<T>(
  req: VercelRequest,
  res: VercelResponse,
  options: AiRouteOptions<T>
): Promise<void> {
  const startedAt = Date.now();
  const log: AiRequestLog = { requestId: randomUUID(), route: options.route };
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    assertBodyWithinBudget(req);
    const input = options.parse(req.body);
    Object.assign(log, options.measure(input));

    const rateLimit = await enforceAiRateLimit(req);
    if (!rateLimit.ok) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
      json(res, 429, { error: SAFE_AI_MESSAGES.rateLimited });
      writeLog({ ...log, status: 429, decision: `rate_limited:${rateLimit.reason}` }, startedAt);
      return;
    }

    const dailyQuota = await consumeDailyAiQuota();
    if (!dailyQuota.ok) {
      res.setHeader("Retry-After", String(dailyQuota.retryAfterSeconds));
      json(res, 429, { error: SAFE_AI_MESSAGES.dailyLimit });
      writeLog({ ...log, status: 429, decision: "daily_limit" }, startedAt);
      return;
    }

    const payload = await options.execute(input);
    json(res, 200, payload);
    writeLog({ ...log, status: 200, decision: "allowed" }, startedAt);
  } catch (error) {
    const safe = resolveSafeAiError(error);
    if (safe.status >= 500) {
      console.error(
        `[ai] ${options.route} ${safe.category}:`,
        error instanceof Error ? `${error.name}: ${error.message.slice(0, 200)}` : "non-error thrown"
      );
    }
    json(res, safe.status, { error: safe.message });
    writeLog({ ...log, status: safe.status, errorCategory: safe.category }, startedAt);
  }
}
