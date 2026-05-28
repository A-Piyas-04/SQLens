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

export const ONBOARDING_THEMES: Record<OnboardingAccent, OnboardingTheme> = {
  blue: {
    shadow: "shadow-blue-950/40",
    glowClass: "onboarding-featured-card-glow-blue",
    heroBorder: "border-sky-500/20",
    heroGradient: "from-sky-950/70 via-slate-900 to-slate-950",
    orbRight: "bg-sky-400/20",
    orbLeft: "bg-blue-500/10",
    iconBorder: "border-sky-400/35",
    iconGradient: "from-sky-500/40 to-blue-900/55",
    iconShadow: "shadow-blue-950/40",
    iconText: "text-sky-200",
    badgeBorder: "border-sky-400/40",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-200",
    stepLabel: "text-sky-300/85",
    progressActive: "bg-sky-400",
    titleGradient: "from-white via-sky-100 to-blue-300",
    bulletGradient: "from-sky-400 to-blue-400",
    primaryButton:
      "border-sky-400/35 bg-gradient-to-b from-sky-500 to-blue-600 shadow-blue-950/40 hover:from-sky-400 hover:to-blue-500",
    badgeLabel: "Quick guide",
  },
  purple: {
    shadow: "shadow-purple-950/50",
    glowClass: "onboarding-featured-card-glow-purple",
    heroBorder: "border-purple-500/20",
    heroGradient: "from-purple-950/80 via-slate-900 to-slate-950",
    orbRight: "bg-purple-500/20",
    orbLeft: "bg-blue-500/10",
    iconBorder: "border-purple-400/30",
    iconGradient: "from-purple-600/40 to-violet-900/60",
    iconShadow: "shadow-purple-950/40",
    iconText: "text-purple-200",
    badgeBorder: "border-purple-400/35",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-200",
    stepLabel: "text-purple-300/80",
    progressActive: "bg-purple-400",
    titleGradient: "from-white via-purple-100 to-violet-300",
    bulletGradient: "from-purple-400 to-violet-400",
    primaryButton:
      "border-purple-400/30 bg-gradient-to-b from-purple-500 to-violet-600 shadow-purple-950/40 hover:from-purple-400 hover:to-violet-500",
    badgeLabel: "Signature feature",
  },
};

export function getStepAccent(step: { accent?: OnboardingAccent }): OnboardingAccent {
  return step.accent ?? "blue";
}
