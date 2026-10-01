import { AiModelUnavailableError, AiQuotaExceededError } from "../services/gemini";
import { GUIDANCE_SQL_REJECTED_MESSAGE } from "./sanitizeGuidance";
import { AiRequestValidationError } from "./validateAiRequest";

export const SAFE_AI_MESSAGES = {
  invalidRequest: "Invalid request.",
  rateLimited: "Too many AI requests. Please try again shortly.",
  dailyLimit: "AI usage limit reached for today. Please try again later.",
  providerBusy: "AI service is busy right now. Please try again shortly.",
  unavailable: "AI service is temporarily unavailable.",
  badModelOutput: "AI returned an unexpected response. Please try again.",
  failed: "AI request failed. Please try again.",
} as const;

/** Thrown when the model replied but its output could not be turned into a valid response. */
export class AiResponseFormatError extends Error {
  constructor() {
    super("AI response format error");
    this.name = "AiResponseFormatError";
  }
}

export type SafeAiError = {
  status: number;
  message: string;
  category: string;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

/**
 * Maps any thrown value to a status and a user-safe message. Raw exception text is
 * never returned in production; development keeps actionable configuration hints.
 */
export function resolveSafeAiError(error: unknown): SafeAiError {
  if (error instanceof AiRequestValidationError) {
    return { status: error.status, message: error.message, category: "validation" };
  }

  const message = errorMessage(error);

  if (message === GUIDANCE_SQL_REJECTED_MESSAGE) {
    return { status: 400, message, category: "sql_in_guidance" };
  }

  if (
    message === "AI returned empty SQL." ||
    message === "Generated SQL contains disallowed destructive or admin commands."
  ) {
    return { status: 400, message, category: "unsafe_generated_sql" };
  }

  if (error instanceof AiResponseFormatError) {
    return { status: 502, message: SAFE_AI_MESSAGES.badModelOutput, category: "bad_model_output" };
  }

  if (error instanceof AiQuotaExceededError) {
    return {
      status: 429,
      message: isProduction()
        ? SAFE_AI_MESSAGES.providerBusy
        : "AI quota exceeded on all configured Gemini models. Please wait a bit or add another model via GEMINI_MODEL_FALLBACKS.",
      category: "provider_quota",
    };
  }

  if (error instanceof AiModelUnavailableError) {
    return {
      status: 503,
      message: isProduction()
        ? SAFE_AI_MESSAGES.unavailable
        : "No configured Gemini model is available for this API key. Set GEMINI_MODEL and optionally GEMINI_MODEL_FALLBACKS in backend/.env.",
      category: "model_unavailable",
    };
  }

  if (message.includes("GEMINI_API_KEY")) {
    return {
      status: 503,
      message: isProduction()
        ? SAFE_AI_MESSAGES.unavailable
        : "AI is not configured. Set GEMINI_API_KEY in backend/.env (free key: https://aistudio.google.com/apikey), then restart the backend.",
      category: "configuration",
    };
  }

  if (
    message.includes("Cannot reach Google Gemini API") ||
    message.includes("Gemini API access denied")
  ) {
    return {
      status: 503,
      message: isProduction() ? SAFE_AI_MESSAGES.unavailable : message,
      category: "provider_unreachable",
    };
  }

  return { status: 500, message: SAFE_AI_MESSAGES.failed, category: "unexpected" };
}
