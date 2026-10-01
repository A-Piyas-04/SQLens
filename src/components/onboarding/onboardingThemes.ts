import type { OnboardingAccent } from "../../constants/onboardingSteps";

export type OnboardingTheme = {
  card: string;
  heroBorder: string;
  iconBox: string;
  iconText: string;
  badge: string;
  stepLabel: string;
  progressActive: string;
  titleClass: string;
  bulletClass: string;
  primaryButton: string;
  badgeLabel: string;
};

const guideTheme: OnboardingTheme = {
  card: "border-ink shadow-[4px_4px_0_0_var(--color-text)]",
  heroBorder: "border-line",
  iconBox: "border-ink bg-surface",
  iconText: "text-ink",
  badge: "border-line-strong text-ink-muted",
  stepLabel: "text-ink-muted",
  progressActive: "bg-ink",
  titleClass: "text-ink",
  bulletClass: "bg-ink",
  primaryButton:
    "border-accent bg-accent text-white hover:bg-accent-ink hover:border-accent-ink",
  badgeLabel: "Tour guide",
};

/** Step 8 — SQL Execution Simulator (signature tour moment) */
const featuredTheme: OnboardingTheme = {
  card: "border-accent-ink shadow-[4px_4px_0_0_var(--color-accent)]",
  heroBorder: "border-accent-ink/30",
  iconBox: "border-accent-ink bg-accent",
  iconText: "text-white",
  badge: "border-accent-ink text-accent-ink",
  stepLabel: "text-accent-ink font-semibold",
  progressActive: "bg-accent",
  titleClass: "text-ink",
  bulletClass: "bg-accent",
  primaryButton:
    "border-accent bg-accent text-white hover:bg-accent-ink hover:border-accent-ink",
  badgeLabel: "Core feature",
};

export const ONBOARDING_THEMES: Record<OnboardingAccent, OnboardingTheme> = {
  blue: guideTheme,
  purple: featuredTheme,
};

export function getStepAccent(step: { accent?: OnboardingAccent }): OnboardingAccent {
  return step.accent ?? "blue";
}

export function isFeaturedTourStep(step: { id: string }): boolean {
  return step.id === "simulator";
}
