import type { ResultSetComparison } from "./types";

const NULL_SENTINEL = "__NULL__";

function normalizeColumnName(name: string): string {
  return name.toLowerCase();
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return NULL_SENTINEL;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function getColumnNames(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}

function rowSignature(
  row: Record<string, unknown>,
  columns: string[]
): string {
  const normalized: Record<string, string> = {};
  const sortedCols = [...columns].map(normalizeColumnName).sort();
  for (const col of sortedCols) {
    const sourceKey = columns.find((c) => normalizeColumnName(c) === col);
    normalized[col] = normalizeCell(sourceKey ? row[sourceKey] : undefined);
  }
  return JSON.stringify(normalized);
}

function sortRowSignatures(signatures: string[]): string[] {
  return [...signatures].sort((a, b) => a.localeCompare(b));
}

export function compareResultSets(
  actual: Record<string, unknown>[],
  expected: Record<string, unknown>[]
): ResultSetComparison {
  const messages: string[] = [];

  const actualCols = getColumnNames(actual).map(normalizeColumnName);
  const expectedCols = getColumnNames(expected).map(normalizeColumnName);

  const actualSet = new Set(actualCols);
  const expectedSet = new Set(expectedCols);

  const missingCols = expectedCols.filter((c) => !actualSet.has(c));
  const extraCols = actualCols.filter((c) => !expectedSet.has(c));

  if (missingCols.length > 0) {
    messages.push(
      `Missing column(s): ${missingCols.map((c) => `\`${c}\``).join(", ")}`
    );
  }
  if (extraCols.length > 0) {
    messages.push(
      `Unexpected column(s): ${extraCols.map((c) => `\`${c}\``).join(", ")}`
    );
  }

  if (actual.length !== expected.length) {
    messages.push(
      `Expected ${expected.length} row(s), got ${actual.length} row(s).`
    );
  }

  if (messages.length > 0) {
    return { match: false, messages };
  }

  const canonicalCols = expectedCols;
  const actualSigs = sortRowSignatures(
    actual.map((row) => rowSignature(row, getColumnNames(actual)))
  );
  const expectedSigs = sortRowSignatures(
    expected.map((row) => rowSignature(row, getColumnNames(expected)))
  );

  if (actualSigs.length !== expectedSigs.length) {
    return {
      match: false,
      messages: [
        `Expected ${expectedSigs.length} row(s), got ${actualSigs.length} row(s).`,
      ],
    };
  }

  for (let i = 0; i < expectedSigs.length; i += 1) {
    if (actualSigs[i] !== expectedSigs[i]) {
      return {
        match: false,
        messages: [
          "Row values do not match the expected output.",
          `Check column values for: ${canonicalCols.map((c) => `\`${c}\``).join(", ")}.`,
        ],
      };
    }
  }

  return { match: true, messages: [] };
}
