import { describe, expect, it } from "vitest";

import { ONBOARDING_STEPS } from "../onboardingSteps";

describe("ONBOARDING_STEPS", () => {
  it("has unique step ids", () => {
    const ids = ONBOARDING_STEPS.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("defines a spotlight target on every step except welcome and finish", () => {
    for (const step of ONBOARDING_STEPS) {
      if (step.id === "welcome" || step.id === "finish") {
        expect(step.placement).toBe("center");
        expect(step.target).toBeUndefined();
      } else {
        expect(step.target).toBeTruthy();
      }
    }
  });
});
