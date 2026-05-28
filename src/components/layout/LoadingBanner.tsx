import { Terminal } from "lucide-react";

import AnimatedReveal from "../common/AnimatedReveal";
import { cn } from "../../lib/utils/cn";

type Props = {
  isVisible: boolean;
};

export default function LoadingBanner({ isVisible }: Props) {
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatedReveal>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-blue-700/50",
          "bg-gradient-to-r from-slate-900/95 via-blue-950/35 to-slate-900/95 p-4",
          "font-mono text-sm text-blue-100 shadow-lg shadow-blue-950/25 backdrop-blur-sm",
          "ring-1 ring-blue-500/10"
        )}
        role="status"
        aria-live="polite"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10">
          <Terminal className="size-4 animate-pulse text-blue-300" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-300/80">
            Executing query
          </p>
          <span className="mt-0.5 block truncate text-blue-100/90">
            postgres@browser:~$ running SQL…
          </span>
        </div>
      </div>
    </AnimatedReveal>
  );
}
