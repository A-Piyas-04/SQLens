import type { OnboardingAccent } from "../../constants/onboardingSteps";

export type OnboardingTheme = {
  shadow: string;
  glowClass: string;
  heroBorder: string;
  heroGradient: string;
  orbRight: string;
  orbLeft: string;
  iconBorder: string;
  iconGradient: string;
  iconShadow: string;
  iconText: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  stepLabel: string;
  progressActive: string;
  titleGradient: string;
  bulletGradient: string;
  primaryButton: string;
  badgeLabel: string;
};

const baseTheme: OnboardingTheme = {
  shadow: "shadow-sm",
  glowClass: "onboarding-featured-card-accent",
  heroBorder: "border-accent",
  heroGradient: "bg-surface-raised",
  orbRight: "bg-accent-muted",
  orbLeft: "bg-surface-muted",
  iconBorder: "border-accent",
  iconGradient: "bg-accent-muted",
  iconShadow: "",
  iconText: "text-accent-ink",
  badgeBorder: "border-accent",
  badgeBg: "bg-accent-muted",
  badgeText: "text-accent-ink",
  stepLabel: "text-accent-ink",
  progressActive: "bg-accent",
  titleGradient: "text-ink",
  bulletGradient: "bg-accent",
  primaryButton:
    "border-accent bg-accent text-white hover:bg-accent-ink hover:border-accent-ink",
  badgeLabel: "Quick guide",
};

export const ONBOARDING_THEMES: Record<OnboardingAccent, OnboardingTheme> = {
  blue: {
    ...baseTheme,
    badgeLabel: "Quick guide",
  },
  purple: {
    ...baseTheme,
    badgeLabel: "Signature feature",
  },
};

export function getStepAccent(step: { accent?: OnboardingAccent }): OnboardingAccent {
  return step.accent ?? "blue";
}
