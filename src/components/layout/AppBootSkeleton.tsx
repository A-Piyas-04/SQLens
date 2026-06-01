import type { ReactNode } from "react";

import Skeleton from "../common/Skeleton";
import { SIDEBAR_DEFAULT_WIDTH } from "../../constants/layout";
import { cn } from "../../lib/utils/cn";

type Props = {
  stepLabel: string;
  progress: number;
};

function PanelSkeleton({
  titleWidth = "w-28",
  children,
  className,
}: {
  titleWidth?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-line bg-surface-raised p-4 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className={cn("h-4", titleWidth)} />
        <Skeleton className="h-8 w-20" />
      </div>
      {children}
    </div>
  );
}

export default function AppBootSkeleton({ stepLabel, progress }: Props) {
  return (
    <div
      className="app-boot-splash fixed inset-0 z-[100] overflow-hidden bg-surface text-ink"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Loading SQLens: ${stepLabel}`}
    >
      <div className="app-boot-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col p-4 pb-20 sm:p-6 sm:pb-20 lg:p-8 lg:pb-20">
        {/* Header skeleton */}
        <header className="mb-6 border-b border-line pb-4">
          <div className="flex min-h-[4rem] items-center gap-4 sm:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
              <Skeleton className="size-[34px] shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-8 w-28 sm:h-9 sm:w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="hidden h-4 w-full max-w-md sm:block" />
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Skeleton className="h-10 w-[4.5rem] rounded-sm" />
              <Skeleton className="h-10 w-[5.5rem] rounded-sm" />
              <Skeleton className="h-10 w-[4.5rem] rounded-sm" />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-start">
          {/* Mobile sidebar */}
          <aside className="rounded-sm border border-line bg-surface-raised p-4 shadow-sm lg:hidden">
            <Skeleton className="mb-4 h-10 w-full" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </aside>

          {/* Desktop sidebar */}
          <aside
            className="hidden shrink-0 rounded-sm border border-line bg-surface-raised p-4 shadow-sm lg:block"
            style={{ width: SIDEBAR_DEFAULT_WIDTH }}
          >
            <Skeleton className="mb-4 h-10 w-full" />
            <div className="mb-4 h-px bg-line" aria-hidden />
            <div className="space-y-3">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="mt-6 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
            </div>
          </aside>

          {/* Main workspace */}
          <main className="min-w-0 flex-1 space-y-5">
            <PanelSkeleton titleWidth="w-24">
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="h-[11rem] w-full sm:h-[12rem]" />
            </PanelSkeleton>

            <PanelSkeleton titleWidth="w-20">
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-4/5" />
              </div>
            </PanelSkeleton>

            <PanelSkeleton titleWidth="w-36">
              <Skeleton className="h-24 w-full" />
            </PanelSkeleton>

            <PanelSkeleton titleWidth="w-44">
              <Skeleton className="h-40 w-full" />
            </PanelSkeleton>
          </main>
        </div>
      </div>

      {/* Boot status */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-line bg-surface-elevated/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">{stepLabel}</p>
          <div className="flex items-center gap-3 sm:min-w-[12rem]">
            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-surface-muted">
              <div
                className="h-full rounded-sm bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono text-xs tabular-nums text-ink-muted">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
