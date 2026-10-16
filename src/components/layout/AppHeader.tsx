import type { ReactNode } from "react";

import { cn } from "../../lib/utils/cn";
import AppHeaderHelp from "./AppHeaderHelp";
import AppHeaderMore from "./AppHeaderMore";
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
  const hasMoreItems = Boolean(promo || onOpenNotes || onStartTour);

  return (
    <header className="surface-3d min-w-0 rounded-sm border border-line bg-surface-inset">
      <div className="flex min-h-[3.5rem] min-w-0 items-center gap-2 px-3 py-2.5 sm:min-h-[4rem] sm:gap-4 sm:px-6 sm:py-3.5 md:gap-6 md:px-7">
        {/* Brand */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5 md:gap-4">
          <img
            src="/sqlens-logo.png"
            alt=""
            width={75}
            height={75}
            className="size-12 shrink-0 rounded-lg sm:size-17 md:size-19"
            aria-hidden
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
              <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl md:text-[1.75rem] lg:text-3xl">
                SQLens
              </h1>
              <span
                className="hidden items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-ink-muted sm:inline-flex"
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
            className={cn(headerToolbarClass, "min-w-0 shrink-0")}
            aria-label="Application commands"
          >
            {/* Desktop: full strip */}
            <div className="hidden items-center gap-2 md:flex">
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
            </div>

            {/* Mobile: Practice + overflow menu */}
            <div className="flex items-center gap-1.5 md:hidden">
              {actions ? (
                <div className="flex items-stretch [&>*+*]:border-l [&>*+*]:border-line">
                  {actions}
                </div>
              ) : null}
              {hasMoreItems ? (
                <AppHeaderMore
                  promo={promo}
                  onOpenNotes={onOpenNotes}
                  onStartTour={onStartTour}
                />
              ) : null}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
