import { GoogleGenerativeAI } from "@google/generative-ai";

/** Free-tier-friendly primary; override with GEMINI_MODEL in backend/.env */
const DEFAULT_PRIMARY_MODEL = "gemini-2.5-flash-lite";

/**
 * Tried in order after GEMINI_MODEL when a model is rate-limited or unavailable.
 * Override entirely with GEMINI_MODEL_FALLBACKS (comma-separated) in backend/.env.
 */
const DEFAULT_FALLBACK_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export class AiQuotaExceededError extends Error {
  constructor() {
    super("AI quota exceeded");
    this.name = "AiQuotaExceededError";
  }
}

export class AiModelUnavailableError extends Error {
  constructor() {
    super("AI model unavailable");
    this.name = "AiModelUnavailableError";
  }
}

type ModelAttempt = {
  model: string;
  reason: string;
  quota: boolean;
  notFound: boolean;
};

function parseCommaSeparatedModels(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function uniqueModels(models: string[]): string[] {
  const seen = new Set<string>();
  return models.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Ordered model list: primary first, then fallbacks (deduped). */
export function resolveModelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_PRIMARY_MODEL;
  const envFallbacks = parseCommaSeparatedModels(process.env.GEMINI_MODEL_FALLBACKS);
  const fallbacks =
    envFallbacks.length > 0 ? envFallbacks : DEFAULT_FALLBACK_MODELS;

  return uniqueModels([primary, ...fallbacks]);
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode;
  return typeof status === "number" ? status : undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

function isQuotaExceeded(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 429) return true;

  const message = getErrorMessage(error);
  return /429|quota|resource_exhausted|rate.?limit/i.test(message);
}

function isModelNotFound(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 404) return true;

  const message = getErrorMessage(error);
  return /not found|is not supported for generateContent/i.test(message);
}

function isOverloaded(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 503) return true;

  const message = getErrorMessage(error);
  return /overloaded|temporarily unavailable|503/i.test(message);
}

function isAuthError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 401 || status === 403) return true;

  const message = getErrorMessage(error);
  return /api.?key|permission|unauthorized|forbidden/i.test(message);
}

function isRetryableWithNextModel(error: unknown): boolean {
  return isQuotaExceeded(error) || isModelNotFound(error) || isOverloaded(error);
}

function classifyAttempt(error: unknown): Pick<ModelAttempt, "reason" | "quota" | "notFound"> {
  const reason = getErrorMessage(error);
  return {
    reason,
    quota: isQuotaExceeded(error),
    notFound: isModelNotFound(error),
  };
}

function throwAfterAllModelsFailed(attempts: ModelAttempt[]): never {
  console.error(
    "[gemini] all models failed:",
    attempts.map((a) => ({ model: a.model, reason: a.reason.slice(0, 120) }))
  );

  if (attempts.some((a) => a.quota)) {
    throw new AiQuotaExceededError();
  }

  if (attempts.length > 0 && attempts.every((a) => a.notFound)) {
    throw new AiModelUnavailableError();
  }

  throw new Error("AI request failed. Please try again.");
}

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend/.env");
  }

  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }

  return client;
}

async function generateWithModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  prompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const models = resolveModelChain();
  const attempts: ModelAttempt[] = [];

  try {
    const genAI = getClient();

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];

      try {
        const text = await generateWithModel(genAI, modelName, prompt);

        if (i > 0) {
          console.info(`[gemini] succeeded with fallback model: ${modelName}`);
        }

        return text;
      } catch (error) {
        if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
          throw error;
        }

        if (isAuthError(error)) {
          throw new Error("Invalid GEMINI_API_KEY or insufficient API permissions.");
        }

        const attempt: ModelAttempt = {
          model: modelName,
          ...classifyAttempt(error),
        };
        attempts.push(attempt);

        const hasMore = i < models.length - 1;
        if (hasMore) {
          const kind = isRetryableWithNextModel(error) ? "retryable" : "error";
          console.warn(
            `[gemini] ${modelName} failed (${kind}: ${attempt.reason.slice(0, 100)}), trying ${models[i + 1]}…`
          );
          continue;
        }
      }
    }

    throwAfterAllModelsFailed(attempts);
  } catch (error) {
    if (
      error instanceof AiQuotaExceededError ||
      error instanceof AiModelUnavailableError
    ) {
      throw error;
    }

    if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
      throw error;
    }

    console.error("[gemini] request failed:", getErrorMessage(error));
    throw new Error("AI request failed. Please try again.");
  }
}
