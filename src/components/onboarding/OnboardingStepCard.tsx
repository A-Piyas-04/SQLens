import {
  CheckCircle2,
  Cpu,
  Database,
  FolderOpen,
  GitBranch,
  LayoutGrid,
  Play,
  Sparkles,
  Table2,
  Terminal,
  type LucideIcon,
} from "lucide-react";

import type { OnboardingStep } from "../../constants/onboardingSteps";
import Button from "../common/Button";
import { cn } from "../../lib/utils/cn";
import { getStepAccent, ONBOARDING_THEMES } from "./onboardingThemes";

const STEP_ICONS: Record<string, LucideIcon> = {
  welcome: Database,
  projects: FolderOpen,
  practice: LayoutGrid,
  schema: Table2,
  editor: Terminal,
  run: Play,
  results: Table2,
  simulator: Cpu,
  erd: GitBranch,
  finish: CheckCircle2,
};

type Props = {
  step: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  layoutReady: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export default function OnboardingStepCard({
  step,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  layoutReady,
  onNext,
  onBack,
  onSkip,
}: Props) {
  const accent = getStepAccent(step);
  const theme = ONBOARDING_THEMES[accent];
  const Icon = STEP_ICONS[step.id] ?? Sparkles;

  return (
    <div
      className={cn(
        "onboarding-tooltip onboarding-featured-card relative z-[201] w-full overflow-hidden",
        "max-w-[min(100%,32rem)] rounded-2xl p-[1px]",
        "shadow-2xl",
        theme.shadow,
        layoutReady ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl",
          theme.glowClass
        )}
        aria-hidden
      />

      <div className="relative rounded-2xl bg-slate-950/95 backdrop-blur-md">
        <div
          className={cn(
            "relative overflow-hidden border-b px-6 pb-5 pt-6 sm:px-7",
            theme.heroBorder,
            theme.heroGradient,
            "bg-gradient-to-br"
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute -right-8 -top-8 size-32 rounded-full blur-2xl",
              theme.orbRight
            )}
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute -left-4 bottom-0 size-24 rounded-full blur-2xl",
              theme.orbLeft
            )}
            aria-hidden
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br shadow-lg",
                  theme.iconBorder,
                  theme.iconGradient,
                  theme.iconShadow
                )}
              >
                <Icon className={cn("size-6", theme.iconText)} aria-hidden />
              </div>
              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                    theme.badgeBorder,
                    theme.badgeBg,
                    theme.badgeText
                  )}
                >
                  <Sparkles className="size-3" aria-hidden />
                  {theme.badgeLabel}
                </span>
                <p className={cn("mt-2 text-xs font-medium", theme.stepLabel)}>
                  Step {stepIndex + 1} of {totalSteps}
                </p>
              </div>
            </div>

            <div className="flex gap-1" aria-hidden>
              {Array.from({ length: totalSteps }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === stepIndex
                      ? cn("w-4", theme.progressActive)
                      : "w-1.5 bg-slate-700"
                  )}
                />
              ))}
            </div>
          </div>

          <h2
            id="onboarding-tour-title"
            className={cn(
              "relative mt-4 bg-gradient-to-r bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-[1.65rem]",
              theme.titleGradient
            )}
          >
            {step.title}
          </h2>
        </div>

        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <p
            id="onboarding-tour-body"
            className="text-base leading-relaxed text-slate-300"
          >
            {step.body}
          </p>

          {step.highlights && step.highlights.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {step.highlights.map((line) => (
                <li key={line} className="flex gap-3 text-sm text-slate-300">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full bg-gradient-to-r",
                      theme.bulletGradient
                    )}
                    aria-hidden
                  />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-5">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirst ? (
                <Button type="button" variant="ghost" size="md" onClick={onBack}>
                  Back
                </Button>
              ) : null}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={onNext}
                className={theme.primaryButton}
              >
                {isLast ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
