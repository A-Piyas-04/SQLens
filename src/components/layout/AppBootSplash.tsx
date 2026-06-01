import { Loader2 } from "lucide-react";

import { SqlensLogo } from "../icons";
import type { BootStep } from "../../hooks/useAppBootReady";
import { cn } from "../../lib/utils/cn";

type Props = {
  step: BootStep;
  stepLabel: string;
  progress: number;
  steps: { id: BootStep; label: string }[];
};

export default function AppBootSplash({
  step,
  stepLabel,
  progress,
  steps,
}: Props) {
  return (
    <div
      className="app-boot-splash fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-surface text-ink"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading SQLens"
    >
      <div className="app-boot-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto w-full max-w-md px-6">
        <div className="app-boot-card rounded-sm border border-line bg-surface-inset p-8 shadow-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="app-boot-logo mb-5 flex size-16 items-center justify-center rounded-sm border border-accent bg-accent-muted">
              <SqlensLogo size={36} />
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              SQLens
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Real PostgreSQL in your browser
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
              <span className="font-medium uppercase tracking-[0.18em]">
                Initializing
              </span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-sm bg-surface-muted">
              <div
                className="app-boot-progress h-full rounded-sm bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex min-h-6 items-center gap-2 text-sm text-accent-ink">
              <Loader2 className="size-4 shrink-0 animate-spin text-accent" aria-hidden />
              <span className="app-boot-status">{stepLabel}</span>
            </div>
          </div>

          <ul className="mt-8 space-y-2 border-t border-line pt-6">
            {steps.map((item) => {
              const isComplete =
                steps.findIndex((s) => s.id === item.id) <
                steps.findIndex((s) => s.id === step);
              const isActive = item.id === step;

              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 text-xs transition-colors duration-300",
                    isComplete && "text-success-ink",
                    isActive && "text-accent-ink",
                    !isComplete && !isActive && "text-ink-muted"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-sm border text-[10px] font-semibold",
                      isComplete &&
                        "border-success-ink bg-success-surface text-success-ink",
                      isActive &&
                        "border-accent bg-accent-muted text-accent-ink",
                      !isComplete &&
                        !isActive &&
                        "border-line bg-surface-raised text-ink-muted"
                    )}
                    aria-hidden
                  >
                    {isComplete ? "✓" : steps.findIndex((s) => s.id === item.id) + 1}
                  </span>
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-ink-muted">
          postgres@browser:~$ SELECT 1;
        </p>
      </div>
    </div>
  );
}
