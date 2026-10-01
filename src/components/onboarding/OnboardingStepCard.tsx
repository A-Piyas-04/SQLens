import {
  CheckCircle2,
  Cpu,
  Database,
  FolderOpen,
  GitBranch,
  LayoutGrid,
  Play,
  Sparkles,
  Star,
  Table2,
  Terminal,
  type LucideIcon,
} from "lucide-react";

import type { OnboardingStep } from "../../constants/onboardingSteps";
import Button from "../common/Button";
import { cn } from "../../lib/utils/cn";
import {
  getStepAccent,
  isFeaturedTourStep,
  ONBOARDING_THEMES,
} from "./onboardingThemes";

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
  const featured = isFeaturedTourStep(step);
  const accent = getStepAccent(step);
  const theme = ONBOARDING_THEMES[accent];
  const Icon = STEP_ICONS[step.id] ?? Sparkles;

  return (
    <div
      className={cn(
        "onboarding-tooltip relative z-[201] w-full",
        "max-w-[min(100%,32rem)]",
        layoutReady ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-sm border bg-surface-elevated",
          theme.card
        )}
      >
        <div
          className={cn(
            "relative border-b px-6 pb-5 pt-6 sm:px-7",
            theme.heroBorder
          )}
        >
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-sm border",
                  featured ? "size-12" : "size-10",
                  theme.iconBox
                )}
              >
                <Icon
                  className={cn(featured ? "size-7" : "size-5", theme.iconText)}
                  aria-hidden
                />
              </div>
              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
                    theme.badge
                  )}
                >
                  {featured ? (
                    <Star className="size-3 fill-accent text-accent" aria-hidden />
                  ) : (
                    <Sparkles className="size-3" aria-hidden />
                  )}
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
                    "h-1 w-3 rounded-[1px] transition-colors",
                    i === stepIndex
                      ? theme.progressActive
                      : i < stepIndex
                        ? "bg-ink-muted"
                        : "bg-line"
                  )}
                />
              ))}
            </div>
          </div>

          <h2
            id="onboarding-tour-title"
            className={cn(
              "font-display relative mt-4 font-bold tracking-tight",
              featured ? "text-[1.75rem] sm:text-[2rem]" : "text-2xl sm:text-[1.65rem]",
              theme.titleClass
            )}
          >
            {step.title}
          </h2>
        </div>

        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <p
            id="onboarding-tour-body"
            className={cn(
              "leading-relaxed text-ink-secondary",
              featured ? "text-[1.05rem]" : "text-base"
            )}
          >
            {step.body}
          </p>

          {step.highlights && step.highlights.length > 0 ? (
            <ul
              className={cn(
                "mt-5 space-y-3",
                featured && "border-t border-dashed border-accent-ink/30 pt-4"
              )}
            >
              {step.highlights.map((line) => (
                <li key={line} className="flex gap-3 text-sm text-ink-secondary">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-[1px]",
                      theme.bulletClass
                    )}
                    aria-hidden
                  />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-ink-muted underline-offset-2 hover:text-ink-secondary hover:underline"
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
                {isLast ? "Finish" : featured ? "Continue" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
