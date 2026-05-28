import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearOnboardingComplete,
  hasCompletedOnboarding,
  setOnboardingComplete,
} from "../onboardingStore";

function createStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("onboardingStore", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when onboarding has not been completed", () => {
    expect(hasCompletedOnboarding()).toBe(false);
  });

  it("persists completion flag", () => {
    setOnboardingComplete(true);
    expect(hasCompletedOnboarding()).toBe(true);
  });

  it("clears completion flag", () => {
    setOnboardingComplete(true);
    clearOnboardingComplete();
    expect(hasCompletedOnboarding()).toBe(false);
  });
});
