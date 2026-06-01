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
          "flex items-center gap-3 rounded-sm border border-accent",
          "bg-surface-inset p-4 font-mono text-sm text-accent-ink"
        )}
        role="status"
        aria-live="polite"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-accent bg-accent-muted">
          <Terminal className="size-4 animate-pulse text-accent" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent-ink">
            Executing query
          </p>
          <span className="mt-0.5 block truncate text-ink-secondary">
            postgres@browser:~$ running SQL…
          </span>
        </div>
      </div>
    </AnimatedReveal>
  );
}
