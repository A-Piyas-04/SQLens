import { describe, expect, it } from "vitest";

import { SQL50_PACK, SQL50_PROBLEMS } from "../sql50";

describe("SQL50 manifest", () => {
  it("has exactly 50 problems", () => {
    expect(SQL50_PROBLEMS).toHaveLength(50);
    expect(SQL50_PACK.problems).toHaveLength(50);
  });

  it("has unique ids and slugs", () => {
    const ids = SQL50_PROBLEMS.map((p) => p.id);
    const slugs = SQL50_PROBLEMS.map((p) => p.slug);
    expect(new Set(ids).size).toBe(50);
    expect(new Set(slugs).size).toBe(50);
  });

  it("has correct difficulty distribution", () => {
    const easy = SQL50_PROBLEMS.filter((p) => p.difficulty === "easy");
    const medium = SQL50_PROBLEMS.filter((p) => p.difficulty === "medium");
    const hard = SQL50_PROBLEMS.filter((p) => p.difficulty === "hard");
    expect(easy).toHaveLength(20);
    expect(medium).toHaveLength(20);
    expect(hard).toHaveLength(10);
  });

  it("each problem has required fields", () => {
    for (const p of SQL50_PROBLEMS) {
      expect(p.title).toBeTruthy();
      expect(p.schemaSql.trim()).toBeTruthy();
      expect(p.seedSql.trim()).toBeTruthy();
      expect(p.expectedOutputSql.trim()).toBeTruthy();
      expect(p.hints.length).toBeGreaterThanOrEqual(2);
      expect(p.officialSolution.trim()).toBeTruthy();
      expect(p.explanation.trim()).toBeTruthy();
      expect(p.topics.length).toBeGreaterThanOrEqual(1);
    }
  });
});
