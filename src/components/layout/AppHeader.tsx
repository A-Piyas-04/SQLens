import type { ReactNode } from "react";

import { SqlensLogo } from "../icons";
import AppHeaderHelp from "./AppHeaderHelp";
import {
  headerToolbarClass,
  headerToolbarDividerClass,
} from "./headerActionButton";

type Props = {
  actions?: ReactNode;
  onStartTour?: () => void;
};

export default function AppHeader({ actions, onStartTour }: Props) {
  const hasToolbar = Boolean(onStartTour || actions);

  return (
    <header className="border-b border-line bg-surface-inset">
      <div className="flex min-h-[4rem] items-center gap-4 py-3 sm:gap-6">
        {/* Brand */}
        <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
          <SqlensLogo size={34} className="shrink-0" aria-hidden />

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem] lg:text-3xl">
                SQLens
              </h1>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-ink-muted"
                title="Runs PostgreSQL locally in your browser"
              >
                <span
                  className="size-2 shrink-0 rounded-full bg-success-ink"
                  aria-hidden
                />
                Local
              </span>
            </div>
            <p className="mt-1 hidden truncate text-sm leading-snug text-ink-muted sm:block md:max-w-md lg:max-w-xl">
              SQL workspace · schema · stepwise query simulation
            </p>
          </div>
        </div>

        {/* Command toolbar */}
        {hasToolbar ? (
          <nav
            className={headerToolbarClass}
            aria-label="Application commands"
          >
            {onStartTour ? <AppHeaderHelp onStartTour={onStartTour} /> : null}
            {onStartTour && actions ? (
              <div className={headerToolbarDividerClass} aria-hidden />
            ) : null}
            {actions ? (
              <div className="flex items-stretch [&>*+*]:border-l [&>*+*]:border-line">
                {actions}
              </div>
            ) : null}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
