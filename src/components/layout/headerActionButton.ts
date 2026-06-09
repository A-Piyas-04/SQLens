import { cn } from "../../lib/utils/cn";

/** Compact header toolbar control (JetBrains / Linear–style). */
export const headerActionButtonClass = cn(
  "relative z-20 inline-flex h-10 shrink-0 items-center gap-2 px-4",
  "text-sm font-medium text-ink-secondary sm:text-[15px]",
  "transition-colors",
  "hover:bg-surface-muted hover:text-ink",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const headerActionButtonOpenClass = "bg-surface-muted text-ink";

/** Icon size for header toolbar buttons */
export const HEADER_ACTION_ICON_SIZE = 20;

/** Accent tint for toolbar icons when the control is closed */
export const headerActionIconAccentClass = "text-accent";

export const headerToolbarClass = cn(
  "flex h-10 items-stretch overflow-visible rounded-sm border border-line bg-surface-raised"
);

export const headerToolbarDividerClass = "w-px shrink-0 self-stretch bg-line";
