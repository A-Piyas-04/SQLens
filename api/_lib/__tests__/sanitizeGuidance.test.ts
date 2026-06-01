import { describe, expect, it } from "vitest";

import {
  containsRunnableSql,
  GUIDANCE_SQL_REJECTED_MESSAGE,
  sanitizeGuidance,
} from "../sanitizeGuidance";

const VALID_GUIDANCE_JSON = JSON.stringify({
  summary: "Filter by department, then link students to courses through enrollments.",
  problemBreakdown: [
    "Identify which table stores department names.",
    "Connect students to enrollments and courses.",
  ],
  techniques: [
    {
      name: "INNER JOIN",
      whenToUse: "When you only want rows that match on both sides of a relationship.",
      notes: "Compare with LEFT JOIN if optional enrollments matter.",
    },
    {
      name: "WHERE",
      whenToUse: "To restrict rows to the CSE department after joins are in place.",
    },
  ],
  tablesAndColumns: [
    "departments.name to filter CSE",
    "students.department_id links to departments",
  ],
  pitfalls: ["Forgetting the enrollments bridge table between students and courses."],
});

describe("sanitizeGuidance", () => {
  it("accepts valid guidance JSON", () => {
    const guidance = sanitizeGuidance(VALID_GUIDANCE_JSON);
    expect(guidance.summary).toContain("department");
    expect(guidance.techniques).toHaveLength(2);
    expect(guidance.problemBreakdown.length).toBeGreaterThan(0);
  });

  it("rejects guidance containing SELECT ... FROM", () => {
    const bad = JSON.stringify({
      summary: "SELECT id FROM students WHERE department = 'CSE'",
      problemBreakdown: ["step"],
      techniques: [{ name: "WHERE", whenToUse: "filter" }],
      tablesAndColumns: ["students"],
      pitfalls: ["none"],
    });

    expect(() => sanitizeGuidance(bad)).toThrow(GUIDANCE_SQL_REJECTED_MESSAGE);
  });

  it("rejects markdown SQL fences in raw response", () => {
    const raw = '```sql\nSELECT * FROM students;\n```';
    expect(() => sanitizeGuidance(raw)).toThrow(GUIDANCE_SQL_REJECTED_MESSAGE);
  });
});

describe("containsRunnableSql", () => {
  it("detects statement-like SQL", () => {
    expect(containsRunnableSql("SELECT name FROM departments")).toBe(true);
  });

  it("allows clause names without runnable SQL", () => {
    expect(containsRunnableSql("Use INNER JOIN when both sides must match.")).toBe(
      false
    );
  });
});
