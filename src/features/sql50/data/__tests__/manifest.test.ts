import { describe, expect, it } from "vitest";

import { SQL50_PACK, SQL50_PROBLEMS } from "../sql50";

describe("SQL50 manifest", () => {
  it("has exactly 50 problems", () => {
    expect(SQL50_PROBLEMS).toHaveLength(50);
    expect(SQL50_PACK.problems).toHaveLength(50);
  });

  it("has unique ids, slugs, and leetcodeIds", () => {
    const ids = SQL50_PROBLEMS.map((p) => p.id);
    const slugs = SQL50_PROBLEMS.map((p) => p.slug);
    const leetcodeIds = SQL50_PROBLEMS.map((p) => p.leetcodeId);
    expect(new Set(ids).size).toBe(50);
    expect(new Set(slugs).size).toBe(50);
    expect(new Set(leetcodeIds).size).toBe(50);
    expect(ids.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 1)
    );
  });

  it("each problem has required fields", () => {
    for (const p of SQL50_PROBLEMS) {
      expect(p.title).toBeTruthy();
      expect(p.leetcodeId).toBeGreaterThan(0);
      expect(p.statement.trim()).toBeTruthy();
      expect(p.schemaSql.trim()).toBeTruthy();
      expect(p.seedSql.trim()).toBeTruthy();
      expect(p.expectedOutputSql.trim()).toBeTruthy();
      expect(p.hints).toHaveLength(3);
      expect(p.officialSolution.trim()).toBeTruthy();
      expect(p.explanation.trim()).toBeTruthy();
      expect(p.topics.length).toBeGreaterThanOrEqual(1);
    }
  });
});
