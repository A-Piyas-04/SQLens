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
          "inline-flex w-fit max-w-full items-center gap-3 rounded-sm border border-line-strong",
          "bg-surface-elevated px-3 py-2 font-mono text-sm text-accent-ink"
        )}
        role="status"
        aria-live="polite"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-retro-chrome">
          <Terminal className="size-3.5 animate-pulse text-surface" aria-hidden />
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
