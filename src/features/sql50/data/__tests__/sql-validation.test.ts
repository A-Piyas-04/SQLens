import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

import { gradeSubmission } from "../../../../lib/practice/submissionEngine";
import { SQL50_PROBLEMS } from "../sql50";

describe("SQL50 problem SQL validation", () => {
  it.each(SQL50_PROBLEMS.map((p) => [p.id, p.slug, p] as const))(
    "problem %i (%s) schema, seed, and expected output execute",
    async (_id, _slug, problem) => {
      const db = new PGlite();
      await db.exec(problem.schemaSql);
      await db.exec(problem.seedSql);

      const expected = await db.query(problem.expectedOutputSql);
      expect(expected.rows.length).toBeGreaterThanOrEqual(0);

      const trimmedSolution = problem.officialSolution.trim();
      if (trimmedSolution.toUpperCase().startsWith("SELECT")) {
        const result = await gradeSubmission(
          db,
          trimmedSolution,
          problem.expectedOutputSql
        );
        expect(result.verdict).toBe("accepted");
      }
    },
    120_000
  );
});
