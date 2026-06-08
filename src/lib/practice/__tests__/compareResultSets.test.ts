import { describe, expect, it } from "vitest";

import { compareResultSets } from "../compareResultSets";

describe("compareResultSets", () => {
  it("matches identical result sets", () => {
    const rows = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    const result = compareResultSets(rows, rows);
    expect(result.match).toBe(true);
    expect(result.messages).toHaveLength(0);
  });

  it("matches regardless of row order", () => {
    const actual = [
      { name: "Bob", id: 2 },
      { name: "Alice", id: 1 },
    ];
    const expected = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    const result = compareResultSets(actual, expected);
    expect(result.match).toBe(true);
  });

  it("matches column names case-insensitively", () => {
    const actual = [{ ID: 1, Name: "Alice" }];
    const expected = [{ id: 1, name: "Alice" }];
    const result = compareResultSets(actual, expected);
    expect(result.match).toBe(true);
  });

  it("reports missing columns", () => {
    const actual = [{ id: 1 }];
    const expected = [{ id: 1, total: 100 }];
    const result = compareResultSets(actual, expected);
    expect(result.match).toBe(false);
    expect(result.messages.some((m) => m.includes("Missing column"))).toBe(
      true
    );
  });

  it("reports row count mismatch", () => {
    const actual = [{ id: 1 }];
    const expected = [
      { id: 1 },
      { id: 2 },
    ];
    const result = compareResultSets(actual, expected);
    expect(result.match).toBe(false);
    expect(result.messages.some((m) => m.includes("Expected 2 row"))).toBe(
      true
    );
  });

  it("reports value mismatch", () => {
    const actual = [{ id: 1, score: 90 }];
    const expected = [{ id: 1, score: 95 }];
    const result = compareResultSets(actual, expected);
    expect(result.match).toBe(false);
    expect(result.messages.some((m) => m.includes("do not match"))).toBe(
      true
    );
  });

  it("normalizes null values", () => {
    const actual = [{ id: 1, note: null }];
    const expected = [{ id: 1, note: null }];
    const result = compareResultSets(actual, expected);
    expect(result.match).toBe(true);
  });
});
