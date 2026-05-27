const DEFAULT_PRIMARY_MODEL = "gemini-2.5-flash-lite";
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

function resolveModelChain(): string[] {
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

function isQuotaError(error: unknown): boolean {
  return /429|quota|resource_exhausted|rate.?limit/i.test(getErrorMessage(error));
}

function isNotFoundError(error: unknown): boolean {
  return /404|not found|is not supported for generateContent/i.test(
    getErrorMessage(error)
  );
}

function isRetryableWithFallback(error: unknown): boolean {
  return /429|503|quota|resource_exhausted|overloaded|temporarily unavailable/i.test(
    getErrorMessage(error)
  );
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
  prompt: string
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
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const maybeMessage =
      (body as { error?: { message?: string } })?.error?.message ||
      `Gemini request failed (${response.status})`;
    throw new Error(maybeMessage);
  }

  return extractGeminiText(body);
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = assertApiKey();
  const models = resolveModelChain();
  const attempts: ModelAttempt[] = [];

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      return await generateWithModel(apiKey, model, prompt);
    } catch (error) {
      const reason = getErrorMessage(error);
      const attempt: ModelAttempt = {
        model,
        reason,
        quota: isQuotaError(error),
        notFound: isNotFoundError(error),
      };
      attempts.push(attempt);

      const hasMore = index < models.length - 1;
      if (hasMore && isRetryableWithFallback(error)) {
        continue;
      }
      break;
    }
  }

  if (attempts.some((attempt) => attempt.quota)) {
    throw new AiQuotaExceededError();
  }

  if (attempts.length > 0 && attempts.every((attempt) => attempt.notFound)) {
    throw new AiModelUnavailableError();
  }

  throw new Error("AI request failed. Please try again.");
}
