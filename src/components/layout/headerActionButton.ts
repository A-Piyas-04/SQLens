import { cn } from "../../lib/utils/cn";

/** Shared chrome for header action icon buttons (help, AI, practice hub). */
export const headerActionButtonClass = cn(
  "relative z-20 flex size-14 shrink-0 items-center justify-center rounded-sm",
  "border border-line-strong bg-surface-inset text-accent-ink",
  "transition-colors hover:border-accent hover:bg-surface-raised hover:text-accent",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
);

export const headerActionButtonOpenClass =
  "border-accent bg-accent-muted text-accent-ink";

/** Icon size tuned for 56px (size-14) circular buttons */
export const HEADER_ACTION_ICON_SIZE = 30;
