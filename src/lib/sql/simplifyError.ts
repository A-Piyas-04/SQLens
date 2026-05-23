type ErrorPattern = {
  match: RegExp;
  message: string;
};

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    match: /relation "[^"]+" does not exist/i,
    message: "PostgreSQL could not find this table.",
  },
  {
    match: /column "[^"]+" does not exist/i,
    message: "PostgreSQL could not find this column.",
  },
  {
    match: /violates foreign key constraint/i,
    message: "This row references a parent row that does not exist.",
  },
  {
    match: /duplicate key value violates unique constraint/i,
    message: "This value already exists and must be unique.",
  },
  {
    match: /null value in column .+ violates not-null constraint/i,
    message: "A required column is missing a value.",
  },
  {
    match: /syntax error at or near/i,
    message: "There is a syntax error near the highlighted token.",
  },
  {
    match: /permission denied/i,
    message: "This operation is not permitted.",
  },
  {
    match: /division by zero/i,
    message: "The query tried to divide by zero.",
  },
  {
    match: /must appear in the GROUP BY clause/i,
    message: "Selected columns must be grouped or aggregated.",
  },
  {
    match: /invalid input syntax/i,
    message: "A value has the wrong data type for this column.",
  },
];

/**
 * Returns a short, readable error message. Falls back to the original text.
 */
export function simplifySqlError(rawError: string): string {
  const trimmed = rawError.trim();
  if (!trimmed) return "Something went wrong while running the query.";

  for (const { match, message } of ERROR_PATTERNS) {
    if (match.test(trimmed)) return message;
  }

  // Strip noisy ERROR prefix when present
  const withoutPrefix = trimmed.replace(/^ERROR:\s*/i, "");
  if (withoutPrefix.length <= 120) return withoutPrefix;

  return `${withoutPrefix.slice(0, 117)}…`;
}
