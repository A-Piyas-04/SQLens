import type { ReactNode } from "react";

import AppHeaderHelp from "./AppHeaderHelp";
import AppHeaderNotes from "./AppHeaderNotes";
import {
  headerToolbarClass,
  headerToolbarDividerClass,
} from "./headerActionButton";

type Props = {
  actions?: ReactNode;
  promo?: ReactNode;
  onStartTour?: () => void;
  onOpenNotes?: () => void;
};

export default function AppHeader({
  actions,
  promo,
  onStartTour,
  onOpenNotes,
}: Props) {
  const hasToolbar = Boolean(onStartTour || onOpenNotes || actions || promo);

  return (
    <header className="surface-3d rounded-sm border border-line bg-surface-inset">
      <div className="flex min-h-[4rem] items-center gap-4 px-6 py-3.5 sm:gap-6 sm:px-7">
        {/* Brand */}
        <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
          <img
            src="/sqlens-logo.png"
            alt=""
            width={75}
            height={75}
            className="size-17 shrink-0 rounded-lg sm:size-19"
            aria-hidden
          />

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
          </div>
        </div>

        {/* Command toolbar */}
        {hasToolbar ? (
          <nav
            className={headerToolbarClass}
            aria-label="Application commands"
          >
            {promo ? (
              <div className="flex items-center px-2 sm:px-3">{promo}</div>
            ) : null}
            {promo && (onOpenNotes || onStartTour || actions) ? (
              <div className={headerToolbarDividerClass} aria-hidden />
            ) : null}
            {onOpenNotes ? <AppHeaderNotes onOpenNotes={onOpenNotes} /> : null}
            {onOpenNotes && onStartTour ? (
              <div className={headerToolbarDividerClass} aria-hidden />
            ) : null}
            {onStartTour ? <AppHeaderHelp onStartTour={onStartTour} /> : null}
            {(onOpenNotes || onStartTour) && actions ? (
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
