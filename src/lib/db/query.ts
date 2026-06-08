import type { PGlite } from "@electric-sql/pglite";

import { splitSqlStatements } from "../sql/splitSqlStatements";

export type QueryResult = {
  success: boolean;
  rows: Record<string, unknown>[];
  error: string | null;
  message: string | null;
};

async function executeStatement(
  db: PGlite,
  sql: string
): Promise<QueryResult> {
  try {
    const result = await db.query(sql);
    const rows = result.rows as Record<string, unknown>[];

    return {
      success: true,
      rows,
      error: null,
      message:
        rows.length > 0
          ? `${rows.length} row(s) returned.`
          : "Query executed successfully. No rows returned.",
    };
  } catch (error) {
    return {
      success: false,
      rows: [],
      error: error instanceof Error ? error.message : "Unknown SQL error",
      message: null,
    };
  }
}

export async function runQuery(db: PGlite, sql: string): Promise<QueryResult> {
  const statements = splitSqlStatements(sql);

  if (statements.length === 0) {
    return {
      success: false,
      rows: [],
      error: "No SQL to execute.",
      message: null,
    };
  }

  if (statements.length === 1) {
    return executeStatement(db, statements[0]);
  }

  const total = statements.length;
  let lastResult: QueryResult | null = null;

  for (let index = 0; index < total; index += 1) {
    const result = await executeStatement(db, statements[index]);
    if (!result.success) {
      return {
        ...result,
        error: `Statement ${index + 1} of ${total}: ${result.error}`,
      };
    }
    lastResult = result;
  }

  const last = lastResult!;
  const prefix = `${total} statements executed.`;

  if (last.rows.length > 0) {
    return {
      ...last,
      message: `${prefix} ${last.rows.length} row(s) returned.`,
    };
  }

  return {
    success: true,
    rows: [],
    error: null,
    message: `${prefix} Query executed successfully.`,
  };
}

export async function resetDatabase(db: PGlite): Promise<void> {
  await db.exec(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
  `);
}

/** Runs multi-statement SQL scripts (DDL + seed data). */
export async function execSqlScript(
  db: PGlite,
  sql: string
): Promise<QueryResult> {
  try {
    await db.exec(sql);
    return {
      success: true,
      rows: [],
      error: null,
      message: "Script executed successfully.",
    };
  } catch (error) {
    return {
      success: false,
      rows: [],
      error: error instanceof Error ? error.message : "Unknown SQL error",
      message: null,
    };
  }
}
