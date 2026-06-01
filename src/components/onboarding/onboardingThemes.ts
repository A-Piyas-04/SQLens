import type { OnboardingAccent } from "../../constants/onboardingSteps";

export type OnboardingTheme = {
  shadow: string;
  heroBorder: string;
  heroGradient: string;
  iconBorder: string;
  iconGradient: string;
  iconText: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  stepLabel: string;
  progressActive: string;
  titleClass: string;
  bulletClass: string;
  primaryButton: string;
  badgeLabel: string;
};

const guideTheme: OnboardingTheme = {
  shadow: "shadow-[0_10px_40px_rgba(28,25,22,0.14)]",
  heroBorder: "border-line",
  heroGradient: "bg-surface-muted/60",
  iconBorder: "border-line-strong",
  iconGradient: "bg-surface-elevated",
  iconText: "text-accent-ink",
  badgeBorder: "border-line-strong",
  badgeBg: "bg-surface-elevated",
  badgeText: "text-ink-muted",
  stepLabel: "text-ink-muted",
  progressActive: "bg-accent",
  titleClass: "text-ink",
  bulletClass: "bg-accent",
  primaryButton:
    "border-accent bg-accent text-white hover:bg-accent-ink hover:border-accent-ink",
  badgeLabel: "Tour guide",
};

/** Step 8 — SQL Execution Simulator (signature tour moment) */
const featuredTheme: OnboardingTheme = {
  shadow: "shadow-[0_16px_48px_rgba(13,107,99,0.22)]",
  heroBorder: "border-accent/40",
  heroGradient: "bg-gradient-to-br from-accent-muted via-surface-elevated to-accent-soft",
  iconBorder: "border-accent/50",
  iconGradient: "bg-gradient-to-br from-accent-muted to-accent-soft",
  iconText: "text-accent-ink",
  badgeBorder: "border-accent/50",
  badgeBg: "bg-accent/10",
  badgeText: "text-accent-ink",
  stepLabel: "text-accent-ink font-semibold",
  progressActive: "bg-accent",
  titleClass: "text-ink",
  bulletClass: "bg-accent ring-2 ring-accent/25",
  primaryButton:
    "border-accent bg-accent text-white shadow-sm hover:bg-accent-ink hover:border-accent-ink",
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
