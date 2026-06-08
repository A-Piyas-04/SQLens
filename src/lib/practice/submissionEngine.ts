import type { PGlite } from "@electric-sql/pglite";

import { runQuery } from "../db/query";
import { simplifySqlError } from "../sql/simplifyError";
import { compareResultSets } from "./compareResultSets";
import type { SubmissionResult } from "./types";

export async function gradeSubmission(
  db: PGlite,
  userSql: string,
  expectedOutputSql: string
): Promise<SubmissionResult> {
  const userResult = await runQuery(db, userSql);

  if (!userResult.success) {
    return {
      verdict: "runtime_error",
      message: simplifySqlError(userResult.error ?? "Query failed."),
    };
  }

  const expectedResult = await runQuery(db, expectedOutputSql);

  if (!expectedResult.success) {
    console.error(
      "[submissionEngine] Expected output query failed:",
      expectedResult.error
    );
    return {
      verdict: "runtime_error",
      message: "Internal error: reference solution could not be evaluated.",
    };
  }

  const comparison = compareResultSets(userResult.rows, expectedResult.rows);

  if (comparison.match) {
    return {
      verdict: "accepted",
      message: "Accepted! Your result matches the expected output.",
      comparison,
      userRowCount: userResult.rows.length,
      expectedRowCount: expectedResult.rows.length,
    };
  }

  return {
    verdict: "wrong_answer",
    message: comparison.messages[0] ?? "Your result does not match.",
    comparison,
    userRowCount: userResult.rows.length,
    expectedRowCount: expectedResult.rows.length,
  };
}
