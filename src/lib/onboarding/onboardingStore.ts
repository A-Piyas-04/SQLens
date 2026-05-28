const ONBOARDING_COMPLETE_KEY = "sqlens-onboarding-complete";

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOnboardingComplete(complete: boolean): void {
  try {
    if (complete) {
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, "1");
    } else {
      localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    }
  } catch {
    // ignore quota / private mode errors
  }
}

export function clearOnboardingComplete(): void {
  setOnboardingComplete(false);
}
