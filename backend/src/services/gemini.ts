import { GoogleGenerativeAI } from "@google/generative-ai";

/** Free-tier-friendly; override with GEMINI_MODEL in backend/.env */
const MODEL_NAME = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite";

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

export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    return text;
  } catch (error) {
    if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
      throw error;
    }

    console.error("[gemini] request failed:", getErrorMessage(error));

    if (isQuotaExceeded(error)) {
      throw new AiQuotaExceededError();
    }

    if (isModelNotFound(error)) {
      throw new AiModelUnavailableError();
    }

    throw new Error("AI request failed. Please try again.");
  }
}
