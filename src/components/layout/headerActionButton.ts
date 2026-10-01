import { cn } from "../../lib/utils/cn";

/** Compact mechanical control for the header instrument strip. */
export const headerActionButtonClass = cn(
  "relative z-20 inline-flex h-9 shrink-0 items-center gap-2 border border-retro-edge bg-surface-elevated px-3",
  "font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-secondary",
  "shadow-[2px_2px_0_0_var(--color-retro-edge)] transition-[color,background-color,transform,box-shadow]",
  "hover:-translate-x-px hover:-translate-y-px hover:bg-surface-muted hover:text-ink hover:shadow-[3px_3px_0_0_var(--color-retro-edge)]",
  "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const headerActionButtonOpenClass = "translate-x-[2px] translate-y-[2px] bg-retro-chrome text-white shadow-none";

/** Icon size for header toolbar buttons */
export const HEADER_ACTION_ICON_SIZE = 20;

/** Accent tint for toolbar icons when the control is closed */
export const headerActionIconAccentClass = "text-accent";

export const headerToolbarClass = cn(
  "flex items-center gap-2 overflow-visible"
);

export const headerToolbarDividerClass = "mx-0.5 w-px shrink-0 self-stretch border-l border-dashed border-line-strong";
