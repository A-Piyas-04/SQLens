import type { PGlite } from "@electric-sql/pglite";

export type QueryResult = {
  success: boolean;
  rows: Record<string, unknown>[];
  error: string | null;
  message: string | null;
};

export async function runQuery(db: PGlite, sql: string): Promise<QueryResult> {
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
