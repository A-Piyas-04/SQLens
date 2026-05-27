import { describe, expect, it } from "vitest";
import {
  buildJoinMatchSteps,
  extractJoinOnClauses,
  resolvePanelJoinKeys,
  resolvePlaybackJoinKeys,
} from "../joinPlaybackModel";
import type { TrackedRow } from "../../../../../lib/simulator";

const row = (id: string, data: Record<string, unknown>): TrackedRow => ({
  _rowId: id,
  ...data,
});

describe("extractJoinOnClauses", () => {
  it("returns ON clauses in order for multi-join SQL", () => {
    const sql = `SELECT * FROM students s
      JOIN enrollments e ON s.id = e.student_id
      JOIN courses c ON c.id = e.course_id`;
    const clauses = extractJoinOnClauses(sql);
    expect(clauses).toHaveLength(2);
    expect(clauses[0].display).toContain("students");
    expect(clauses[1].display).toContain("courses");
  });
});

describe("resolvePanelJoinKeys", () => {
  it("maps keys to working-set vs new table for second join layer", () => {
    const clause = {
      leftTable: "courses",
      leftKey: "id",
      rightTable: "enrollments",
      rightKey: "course_id",
      display: "courses.id = enrollments.course_id",
    };
    const leftRows = [row("w1", { student_id: 1, course_id: 10, grade: "A" })];
    const rightRows = [row("c1", { id: 10, title: "DB" })];

    const keys = resolvePanelJoinKeys(clause, "courses", leftRows, rightRows);
    expect(keys.leftKey).toBe("course_id");
    expect(keys.rightKey).toBe("id");
  });
});

describe("buildJoinMatchSteps", () => {
  it("does not cross-match when key values are undefined", () => {
    const leftRows = [row("l1", { name: "A" }), row("l2", { name: "B" })];
    const rightRows = [row("r1", { x: 1 }), row("r2", { x: 2 })];
    const joined = [row("j1", { name: "A", x: 1 })];

    const steps = buildJoinMatchSteps(leftRows, rightRows, joined, "missing", "missing", false);
    for (const step of steps) {
      expect(step.pairs.length).toBe(0);
    }
  });

  it("pairs rows by join keys only", () => {
    const leftRows = [
      row("l1", { student_id: 1 }),
      row("l2", { student_id: 2 }),
    ];
    const rightRows = [
      row("r1", { course_id: 1 }),
      row("r2", { course_id: 2 }),
    ];
    const joined = [
      row("j1", { student_id: 1, course_id: 1 }),
      row("j2", { student_id: 2, course_id: 2 }),
    ];

    const steps = buildJoinMatchSteps(
      leftRows,
      rightRows,
      joined,
      "student_id",
      "course_id",
      false
    );
    expect(steps.find((s) => s.leftId === "l1")?.pairs).toEqual([{ rightId: "r1" }]);
    expect(steps.find((s) => s.leftId === "l2")?.pairs).toEqual([{ rightId: "r2" }]);
  });
});

describe("resolvePlaybackJoinKeys", () => {
  it("selects join layer by index", () => {
    const sql = `SELECT * FROM a JOIN b ON a.id = b.a_id JOIN c ON c.id = b.c_id`;
    const keys = resolvePlaybackJoinKeys(sql, 1, 2, "c", [], []);
    expect(keys.display).toContain("c");
    expect(keys.joinLayer).toBe(2);
  });
});
