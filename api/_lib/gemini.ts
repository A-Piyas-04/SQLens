const DEFAULT_PRIMARY_MODEL = "gemini-2.0-flash-lite";

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
    .map((value) => value.trim())
    .filter(Boolean);
}

function uniqueModels(models: string[]): string[] {
  const seen = new Set<string>();
  return models.filter((model) => {
    const key = model.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveModelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_PRIMARY_MODEL;
  const envFallbacks = parseCommaSeparatedModels(process.env.GEMINI_MODEL_FALLBACKS);
  const fallbacks =
    envFallbacks.length > 0 ? envFallbacks : DEFAULT_FALLBACK_MODELS;
  return uniqueModels([primary, ...fallbacks]);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

function getErrorStatus(error: unknown): number | undefined {
  const message = getErrorMessage(error);
  const bracketMatch = message.match(/\[(\d{3})\]/);
  if (bracketMatch) return Number(bracketMatch[1]);
  return undefined;
}

function isQuotaExceeded(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 429) return true;
  return /429|quota|resource_exhausted|rate.?limit/i.test(getErrorMessage(error));
}

function isModelNotFound(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 404) return true;
  return /404|not found|is not supported for generateContent/i.test(
    getErrorMessage(error)
  );
}

function isOverloaded(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 503 || status === 500) return true;
  return /overloaded|temporarily unavailable|503|500/i.test(getErrorMessage(error));
}

function isAccessDenied(error: unknown): boolean {
  return getErrorStatus(error) === 403;
}

function isAuthError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 401) return true;
  return /invalid.*api.*key|api key not valid|api_key_invalid/i.test(
    getErrorMessage(error)
  );
}

function isNetworkError(error: unknown): boolean {
  return /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|network/i.test(
    getErrorMessage(error)
  );
}

function shouldTryNextModel(error: unknown): boolean {
  return (
    isQuotaExceeded(error) ||
    isModelNotFound(error) ||
    isOverloaded(error) ||
    isAccessDenied(error) ||
    getErrorStatus(error) === 400
  );
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
      "Gemini API access denied. Verify GEMINI_API_KEY at Google AI Studio and enable the Generative Language API."
    );
  }

  throw new Error("AI request failed. Please try again.");
}

function assertApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY.");
  }
  return key;
}

function extractGeminiText(payload: unknown): string {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}

async function generateWithModel(
  apiKey: string,
  model: string,
  prompt: string,
  jsonMode = false
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      ...(jsonMode
        ? { generationConfig: { responseMimeType: "application/json" } }
        : {}),
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const maybeMessage =
      (body as { error?: { message?: string } })?.error?.message ||
      `Gemini request failed (${response.status})`;
    throw new Error(`[${response.status}] ${maybeMessage}`);
  }

  return extractGeminiText(body);
}

export async function generateWithGemini(
  prompt: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const apiKey = assertApiKey();
  const models = resolveModelChain();
  const jsonMode = options?.jsonMode ?? false;
  const attempts: ModelAttempt[] = [];

  console.info(`[gemini] model chain: ${models.join(" → ")}`);

  for (let i = 0; i < models.length; i++) {
    const model = models[i];

    try {
      let text: string;
      try {
        text = await generateWithModel(apiKey, model, prompt, jsonMode);
      } catch (error) {
        if (jsonMode && shouldTryNextModel(error)) {
          console.warn(
            `[gemini] ${model} JSON mode failed, retrying same model without JSON…`
          );
          text = await generateWithModel(apiKey, model, prompt, false);
        } else {
          throw error;
        }
      }

      if (i > 0) {
        console.info(`[gemini] succeeded with fallback model: ${model}`);
      }

      return text;
    } catch (error) {
      if (isAuthError(error)) {
        throw new Error("Invalid GEMINI_API_KEY or insufficient API permissions.");
      }

      if (isNetworkError(error)) {
        throw new Error(
          "Cannot reach Google Gemini API. Check server network access or try again later."
        );
      }

      const reason = getErrorMessage(error);
      attempts.push({
        model,
        reason,
        quota: isQuotaExceeded(error),
        notFound: isModelNotFound(error),
      });

      const hasMore = i < models.length - 1;
      if (hasMore) {
        const kind = shouldTryNextModel(error) ? "retryable" : "non-retryable";
        console.warn(
          `[gemini] ${model} failed (${kind}: ${reason.slice(0, 100)}), trying ${models[i + 1]}…`
        );
        continue;
      }
    }
  }

  throwAfterAllModelsFailed(attempts);
}
