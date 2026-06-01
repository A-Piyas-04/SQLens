import type { ReactNode } from "react";

import { SqlensLogo } from "../icons";
import AppHeaderHelp from "./AppHeaderHelp";

type Props = {
  actions?: ReactNode;
  onStartTour?: () => void;
};

export default function AppHeader({ actions, onStartTour }: Props) {
  return (
    <header className="rounded-sm border border-line bg-surface-inset p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-sm border border-line bg-surface-raised">
            <SqlensLogo size={32} />
          </div>

          <div className="relative">
            <span
              className="font-display pointer-events-none absolute -left-1 -top-6 select-none text-7xl font-bold leading-none text-line sm:text-8xl"
              aria-hidden
            >
              01
            </span>
            <div className="relative flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                SQLens
              </h1>
              <span className="rounded-sm border border-line bg-accent-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
                Local-first
              </span>
            </div>
            <p className="relative mt-1 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-[15px]">
              Write SQL, inspect results, and explore schema — powered by real PostgreSQL in your browser.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onStartTour ? <AppHeaderHelp onStartTour={onStartTour} /> : null}
          {actions}
        </div>
      </div>
    </header>
  );
}
