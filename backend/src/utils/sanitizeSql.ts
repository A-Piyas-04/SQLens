const DANGEROUS_PATTERNS = [
  /\bDROP\s+DATABASE\b/i,
  /\bDROP\s+SCHEMA\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+SYSTEM\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+INDEX\b/i,
  /\bDROP\s+VIEW\b/i,
  /\bDROP\s+ROLE\b/i,
  /\bDROP\s+USER\b/i,
  /\bGRANT\s+ALL\b/i,
  /\bREVOKE\s+ALL\b/i,
  /\bCREATE\s+ROLE\b/i,
  /\bALTER\s+ROLE\b/i,
  /\bCOPY\s+.*\s+TO\s+PROGRAM\b/i,
  /\bpg_terminate_backend\b/i,
  /\bpg_cancel_backend\b/i,
];

const MARKDOWN_FENCE = /^```(?:sql)?\s*\n?([\s\S]*?)\n?```$/i;

export function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(MARKDOWN_FENCE);
  if (match?.[1]) {
    return match[1].trim();
  }
  return trimmed.replace(/^```(?:sql)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function containsDangerousSql(sql: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(sql));
}

export function sanitizeGeneratedSql(raw: string): string {
  const sql = stripMarkdownFences(raw);

  if (!sql) {
    throw new Error("AI returned empty SQL.");
  }

  if (containsDangerousSql(sql)) {
    throw new Error(
      "Generated SQL contains disallowed destructive or admin commands."
    );
  }

  return sql;
}
