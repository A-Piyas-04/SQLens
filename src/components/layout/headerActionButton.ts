import { cn } from "../../lib/utils/cn";

/** Shared chrome for header action icon buttons (help, AI, practice hub). */
export const headerActionButtonClass = cn(
  "relative z-20 flex size-14 shrink-0 items-center justify-center rounded-full",
  "border border-slate-600/80 bg-slate-800/95 text-blue-300",
  "shadow-xl shadow-slate-950/60 backdrop-blur-sm transition-colors",
  "hover:border-blue-500/50 hover:bg-slate-700 hover:text-blue-200",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
);

export const headerActionButtonOpenClass =
  "border-blue-500/50 bg-blue-950/90 text-blue-200";

/** Icon size tuned for 56px (size-14) circular buttons */
export const HEADER_ACTION_ICON_SIZE = 30;
