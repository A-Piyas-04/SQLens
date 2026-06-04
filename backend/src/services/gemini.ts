import { GoogleGenerativeAI } from "@google/generative-ai";

/** Free-tier-friendly primary; override with GEMINI_MODEL in backend/.env */
const DEFAULT_PRIMARY_MODEL = "gemini-2.0-flash-lite";

/**
 * Tried in order when the primary model fails (quota, 404, 403, overload, etc.).
 * Override with GEMINI_MODEL_FALLBACKS (comma-separated) in backend/.env.
 */
const DEFAULT_FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
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
  if (typeof status === "number") return status;

  const message = getErrorMessage(error);
  const bracketMatch = message.match(/\[(\d{3})\]/);
  if (bracketMatch) return Number(bracketMatch[1]);

  return undefined;
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
  if (status === 503 || status === 500) return true;

  const message = getErrorMessage(error);
  return /overloaded|temporarily unavailable|503|500/i.test(message);
}

function isAuthError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 401) return true;

  const message = getErrorMessage(error);
  return /invalid.*api.*key|api key not valid|api_key_invalid/i.test(message);
}

function isAccessDenied(error: unknown): boolean {
  return getErrorStatus(error) === 403;
}

function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|network/i.test(
    message
  );
}

/** Whether to try the next model in the chain (not used for invalid key / network). */
function shouldTryNextModel(error: unknown): boolean {
  return (
    isQuotaExceeded(error) ||
    isModelNotFound(error) ||
    isOverloaded(error) ||
    isAccessDenied(error) ||
    getErrorStatus(error) === 400
  );
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

  if (attempts.some((a) => /403|forbidden|access denied/i.test(a.reason))) {
    throw new Error(
      "Gemini API access denied. Verify GEMINI_API_KEY at Google AI Studio and enable the Generative Language API for your project."
    );
  }

  throw new Error("AI request failed. Please try again.");
}

const PLACEHOLDER_GEMINI_KEYS = new Set([
  "your_google_ai_studio_key",
  "your_key",
  "your_gemini_api_key",
]);

export function isPlaceholderGeminiKey(key: string | undefined): boolean {
  if (!key?.trim()) return false;
  return PLACEHOLDER_GEMINI_KEYS.has(key.trim().toLowerCase());
}

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend/.env");
  }

  if (isPlaceholderGeminiKey(apiKey)) {
    throw new Error(
      "Placeholder GEMINI_API_KEY in backend/.env — replace it with a key from https://aistudio.google.com/apikey"
    );
  }

  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }

  return client;
}

async function generateWithModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  prompt: string,
  jsonMode = false
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(jsonMode
      ? { generationConfig: { responseMimeType: "application/json" } }
      : {}),
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export async function generateWithGemini(
  prompt: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const models = resolveModelChain();
  const attempts: ModelAttempt[] = [];
  const jsonMode = options?.jsonMode ?? false;

  console.info(`[gemini] model chain: ${models.join(" → ")}`);

  try {
    const genAI = getClient();

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];

      try {
        let text: string;
        try {
          text = await generateWithModel(genAI, modelName, prompt, jsonMode);
        } catch (error) {
          if (jsonMode && shouldTryNextModel(error)) {
            console.warn(
              `[gemini] ${modelName} JSON mode failed, retrying same model without JSON…`
            );
            text = await generateWithModel(genAI, modelName, prompt, false);
          } else {
            throw error;
          }
        }

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

        if (isNetworkError(error)) {
          throw new Error(
            "Cannot reach Google Gemini API. Check Docker/network access or try again later."
          );
        }

        const attempt: ModelAttempt = {
          model: modelName,
          ...classifyAttempt(error),
        };
        attempts.push(attempt);

        const hasMore = i < models.length - 1;
        if (hasMore) {
          const nextModel = models[i + 1];
          const kind = shouldTryNextModel(error) ? "retryable" : "non-retryable";
          console.warn(
            `[gemini] ${modelName} failed (${kind}: ${attempt.reason.slice(0, 100)}), trying ${nextModel}…`
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
