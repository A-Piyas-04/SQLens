import type { SqlGuidance, SqlGuidanceTechnique } from "./sqlGuidanceTypes";

const MARKDOWN_FENCE = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i;

/** Max chars between a SQL verb and FROM — avoids false positives across JSON fields. */
const SQL_FRAGMENT_MAX_GAP = 120;

const SELECT_FROM_PATTERN = new RegExp(
  `\\bSELECT\\b[\\s\\S]{0,${SQL_FRAGMENT_MAX_GAP}}\\bFROM\\b`,
  "i"
);

const DELETE_FROM_PATTERN = new RegExp(
  `\\bDELETE\\b[\\s\\S]{0,${SQL_FRAGMENT_MAX_GAP}}\\bFROM\\b`,
  "i"
);

const INSERT_INTO_PATTERN = new RegExp(
  `\\bINSERT\\b[\\s\\S]{0,${SQL_FRAGMENT_MAX_GAP}}\\bINTO\\b`,
  "i"
);

const UPDATE_SET_PATTERN = new RegExp(
  `\\bUPDATE\\b[\\s\\S]{0,${SQL_FRAGMENT_MAX_GAP}}\\bSET\\b`,
  "i"
);

const WITH_AS_PATTERN = new RegExp(
  `\\bWITH\\b[\\s\\S]{0,${SQL_FRAGMENT_MAX_GAP}}\\bAS\\b`,
  "i"
);

const SQL_FENCE_PATTERN = /```(?:sql)?\s*[\s\S]*?```/i;

const STATEMENT_LIKE_PATTERN =
  /;\s*(SELECT|INSERT|UPDATE|DELETE|WITH)\b/i;

export const GUIDANCE_SQL_REJECTED_MESSAGE =
  "Assistant returned a query instead of guidance. Please try again.";

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(MARKDOWN_FENCE);
  if (match?.[1]) {
    return match[1].trim();
  }
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function containsRunnableSql(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  if (SQL_FENCE_PATTERN.test(normalized)) return true;
  if (SELECT_FROM_PATTERN.test(normalized)) return true;
  if (DELETE_FROM_PATTERN.test(normalized)) return true;
  if (INSERT_INTO_PATTERN.test(normalized)) return true;
  if (UPDATE_SET_PATTERN.test(normalized)) return true;
  if (WITH_AS_PATTERN.test(normalized)) return true;
  if (STATEMENT_LIKE_PATTERN.test(normalized)) return true;
  return false;
}

function assertNoRunnableSql(value: string, field: string): void {
  if (containsRunnableSql(value)) {
    throw new Error(GUIDANCE_SQL_REJECTED_MESSAGE);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseTechnique(value: unknown, index: number): SqlGuidanceTechnique {
  if (typeof value !== "object" || value === null) {
    throw new Error(`techniques[${index}] must be an object.`);
  }

  const item = value as Record<string, unknown>;
  if (!isNonEmptyString(item.name)) {
    throw new Error(`techniques[${index}].name must be a non-empty string.`);
  }
  if (!isNonEmptyString(item.whenToUse)) {
    throw new Error(`techniques[${index}].whenToUse must be a non-empty string.`);
  }

  const technique: SqlGuidanceTechnique = {
    name: item.name.trim(),
    whenToUse: item.whenToUse.trim(),
  };

  if (item.notes !== undefined) {
    if (!isNonEmptyString(item.notes)) {
      throw new Error(`techniques[${index}].notes must be a non-empty string when provided.`);
    }
    technique.notes = item.notes.trim();
  }

  assertNoRunnableSql(technique.name, `techniques[${index}].name`);
  assertNoRunnableSql(technique.whenToUse, `techniques[${index}].whenToUse`);
  if (technique.notes) {
    assertNoRunnableSql(technique.notes, `techniques[${index}].notes`);
  }

  return technique;
}

function parseStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty array of strings.`);
  }

  return value.map((entry, index) => {
    if (!isNonEmptyString(entry)) {
      throw new Error(`${field}[${index}] must be a non-empty string.`);
    }
    const text = entry.trim();
    assertNoRunnableSql(text, `${field}[${index}]`);
    return text;
  });
}

export function sanitizeGuidance(raw: string): SqlGuidance {
  const trimmed = raw.trim();
  if (SQL_FENCE_PATTERN.test(trimmed)) {
    throw new Error(GUIDANCE_SQL_REJECTED_MESSAGE);
  }

  const jsonText = stripMarkdownFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("AI returned invalid guidance JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI returned invalid guidance JSON.");
  }

  const body = parsed as Record<string, unknown>;

  if (!isNonEmptyString(body.summary)) {
    throw new Error("guidance.summary must be a non-empty string.");
  }

  const summary = body.summary.trim();
  assertNoRunnableSql(summary, "summary");

  const problemBreakdown = parseStringArray(
    body.problemBreakdown,
    "problemBreakdown"
  );

  if (!Array.isArray(body.techniques) || body.techniques.length === 0) {
    throw new Error("techniques must be a non-empty array.");
  }

  const techniques = body.techniques.map((entry, index) =>
    parseTechnique(entry, index)
  );

  const tablesAndColumns = parseStringArray(
    body.tablesAndColumns,
    "tablesAndColumns"
  );

  const pitfalls = parseStringArray(body.pitfalls, "pitfalls");

  return {
    summary,
    problemBreakdown,
    techniques,
    tablesAndColumns,
    pitfalls,
  };
}
