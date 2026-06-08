import type { PGlite } from "@electric-sql/pglite";

import { execSqlScript, resetDatabase } from "../db/query";
import type { PracticeProblem } from "./types";

export async function loadProblem(
  db: PGlite,
  problem: PracticeProblem
): Promise<{ success: boolean; error?: string }> {
  await resetDatabase(db);

  const schemaResult = await execSqlScript(db, problem.schemaSql);
  if (!schemaResult.success) {
    return {
      success: false,
      error: schemaResult.error ?? "Failed to load problem schema.",
    };
  }

  const seedResult = await execSqlScript(db, problem.seedSql);
  if (!seedResult.success) {
    return {
      success: false,
      error: seedResult.error ?? "Failed to load problem seed data.",
    };
  }

  return { success: true };
}
