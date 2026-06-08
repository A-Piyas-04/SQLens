import { describe, expect, it } from "vitest";

import { computeScore, mergeBestScore } from "../scoring";

describe("computeScore", () => {
  it("returns 100 for a perfect solve", () => {
    expect(
      computeScore({
        hintsUsed: 0,
        failedAttempts: 0,
        solutionViewedBeforeSolve: false,
      })
    ).toBe(100);
  });

  it("deducts 10 per hint", () => {
    expect(
      computeScore({
        hintsUsed: 2,
        failedAttempts: 0,
        solutionViewedBeforeSolve: false,
      })
    ).toBe(80);
  });

  it("deducts 5 per failed attempt", () => {
    expect(
      computeScore({
        hintsUsed: 0,
        failedAttempts: 3,
        solutionViewedBeforeSolve: false,
      })
    ).toBe(85);
  });

  it("deducts 20 if solution viewed before solve", () => {
    expect(
      computeScore({
        hintsUsed: 0,
        failedAttempts: 0,
        solutionViewedBeforeSolve: true,
      })
    ).toBe(80);
  });

  it("clamps to 0 minimum", () => {
    expect(
      computeScore({
        hintsUsed: 5,
        failedAttempts: 10,
        solutionViewedBeforeSolve: true,
      })
    ).toBe(0);
  });
});

describe("mergeBestScore", () => {
  it("keeps the higher score", () => {
    expect(mergeBestScore(70, 85)).toBe(85);
    expect(mergeBestScore(90, 60)).toBe(90);
  });
});
