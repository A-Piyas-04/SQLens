// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { hasSeenScoringIntro, markScoringIntroSeen } from "../scoringIntroStore";

describe("scoringIntroStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reports the intro as unseen on first visit", () => {
    expect(hasSeenScoringIntro()).toBe(false);
  });

  it("remembers the intro once dismissed", () => {
    markScoringIntroSeen();
    expect(hasSeenScoringIntro()).toBe(true);
  });
});
