import type { Sql50CoachingContext } from "../prompts/sql50CoachingPrompt";

export const AI_FIELD_LIMITS = {
  prompt: 2_000,
  userPrompt: 2_000,
  schema: 4_000,
  problemTitle: 200,
  problemDescription: 1_000,
  lastError: 500,
  topicCount: 20,
  topicChars: 80,
  hintCount: 10,
  hintChars: 500,
} as const;

export const AI_MAX_BODY_BYTES = 32 * 1024;

const MAX_HINTS_USED = 1_000;

export class AiRequestValidationError extends Error {
  readonly status: 400 | 413;

  constructor(message: string, status: 400 | 413 = 400) {
    super(message);
    this.name = "AiRequestValidationError";
    this.status = status;
  }
}

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

function headerValue(req: RequestLike, name: string): string | undefined {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

/** Rejects bodies above the AI request budget before any parsing or prompt work. */
export function assertBodyWithinBudget(
  req: RequestLike,
  maxBytes: number = AI_MAX_BODY_BYTES
): void {
  const tooLarge = new AiRequestValidationError("Request is too large.", 413);

  const declared = Number(headerValue(req, "content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw tooLarge;
  }

  if (req.body === undefined || req.body === null) return;

  const serialized =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (new TextEncoder().encode(serialized).length > maxBytes) {
    throw tooLarge;
  }
}

function asRecord(body: unknown, message: string): Record<string, unknown> {
  let value = body;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      throw new AiRequestValidationError(message);
    }
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AiRequestValidationError(message);
  }
  return value as Record<string, unknown>;
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  maxChars: number
): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new AiRequestValidationError(
      `Request body must include a non-empty string ${key}.`
    );
  }
  const trimmed = value.trim();
  if (trimmed.length > maxChars) {
    throw new AiRequestValidationError(
      `${key} is too long. Maximum length is ${maxChars} characters.`
    );
  }
  return trimmed;
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
  maxChars: number
): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new AiRequestValidationError(`${key} must be a string when provided.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxChars) {
    throw new AiRequestValidationError(
      `${key} is too long. Maximum length is ${maxChars} characters.`
    );
  }
  return trimmed || undefined;
}

function optionalStringList(
  record: Record<string, unknown>,
  key: string,
  maxItems: number,
  maxChars: number
): string[] {
  const value = record[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new AiRequestValidationError(`${key} must be an array when provided.`);
  }
  if (value.length > maxItems) {
    throw new AiRequestValidationError(
      `Too many ${key}. Maximum is ${maxItems}.`
    );
  }

  const items = value.filter((item): item is string => typeof item === "string");
  for (const item of items) {
    if (item.length > maxChars) {
      throw new AiRequestValidationError(
        `Each item in ${key} must be at most ${maxChars} characters.`
      );
    }
  }
  return items;
}

export function validatePromptRequest(body: unknown): { prompt: string } {
  const record = asRecord(body, "Request body must include a non-empty string prompt.");
  return { prompt: requiredString(record, "prompt", AI_FIELD_LIMITS.prompt) };
}

export function validateGuidanceRequest(body: unknown): {
  prompt: string;
  schema?: string;
} {
  const record = asRecord(body, "Request body must include a non-empty string prompt.");
  return {
    prompt: requiredString(record, "prompt", AI_FIELD_LIMITS.prompt),
    schema: optionalString(record, "schema", AI_FIELD_LIMITS.schema),
  };
}

export function validateCoachingRequest(body: unknown): Sql50CoachingContext {
  const record = asRecord(body, "Request body must be a JSON object.");

  const problemTitle = requiredString(record, "problemTitle", AI_FIELD_LIMITS.problemTitle);
  const problemDescription = requiredString(
    record,
    "problemDescription",
    AI_FIELD_LIMITS.problemDescription
  );
  const userPrompt = requiredString(record, "userPrompt", AI_FIELD_LIMITS.userPrompt);

  const topics = optionalStringList(
    record,
    "topics",
    AI_FIELD_LIMITS.topicCount,
    AI_FIELD_LIMITS.topicChars
  );
  const unlockedHints = optionalStringList(
    record,
    "unlockedHints",
    AI_FIELD_LIMITS.hintCount,
    AI_FIELD_LIMITS.hintChars
  );

  const userError = optionalString(record, "userError", AI_FIELD_LIMITS.lastError);
  const schema = optionalString(record, "schema", AI_FIELD_LIMITS.schema);

  const rawHintsUsed = record.hintsUsed;
  const hintsUsed =
    typeof rawHintsUsed === "number" && Number.isFinite(rawHintsUsed) && rawHintsUsed >= 0
      ? Math.min(Math.floor(rawHintsUsed), MAX_HINTS_USED)
      : 0;

  return {
    problemTitle,
    problemDescription,
    topics,
    userPrompt,
    userError,
    hintsUsed,
    unlockedHints,
    schema,
  };
}
