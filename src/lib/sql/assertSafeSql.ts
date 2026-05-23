/**
 * Client-side guard: rejects SQL that contains destructive commands
 * before it reaches the editor. Mirrors the backend sanitizeSql check.
 */
const DANGEROUS_PATTERNS = [
  /\bDROP\s+DATABASE\b/i,
  /\bDROP\s+SCHEMA\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+SYSTEM\b/i,
];

export function assertSafeSql(sql: string): void {
  const matched = DANGEROUS_PATTERNS.find((pattern) => pattern.test(sql));

  if (matched) {
    throw new Error(
      "Generated SQL contains a disallowed command and was blocked."
    );
  }
}
