import { Database, Loader2 } from "lucide-react";

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
      className="app-boot-splash fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950 text-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading SQLens"
    >
      <div className="app-boot-grid pointer-events-none absolute inset-0" aria-hidden />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/35 via-slate-950 to-slate-950"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-md px-6">
        <div className="app-boot-card rounded-2xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl shadow-blue-950/20 backdrop-blur-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="app-boot-logo mb-5 flex size-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/35 to-slate-900 shadow-lg shadow-blue-950/40">
              <Database className="size-8 text-blue-300" aria-hidden />
            </div>

            <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              SQLens
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Real PostgreSQL in your browser
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="font-medium uppercase tracking-[0.18em]">
                Initializing
              </span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/90">
              <div
                className="app-boot-progress h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-300 transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex min-h-6 items-center gap-2 text-sm text-blue-200">
              <Loader2 className="size-4 shrink-0 animate-spin text-blue-400" aria-hidden />
              <span className="app-boot-status">{stepLabel}</span>
            </div>
          </div>

          <ul className="mt-8 space-y-2 border-t border-slate-800/80 pt-6">
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
                    isComplete && "text-emerald-400/90",
                    isActive && "text-blue-200",
                    !isComplete && !isActive && "text-slate-600"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                      isComplete &&
                        "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
                      isActive &&
                        "border-blue-500/50 bg-blue-500/15 text-blue-300",
                      !isComplete &&
                        !isActive &&
                        "border-slate-700/80 bg-slate-900/80 text-slate-600"
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

        <p className="mt-6 text-center font-mono text-[11px] text-slate-600">
          postgres@browser:~$ SELECT 1;
        </p>
      </div>
    </div>
  );
}
