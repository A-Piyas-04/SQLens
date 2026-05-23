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
          "flex items-center gap-3 rounded-xl border border-blue-800/60",
          "bg-gradient-to-r from-slate-900/90 to-blue-950/40 p-4",
          "font-mono text-sm text-blue-200 shadow-lg shadow-blue-950/20"
        )}
        role="status"
        aria-live="polite"
      >
        <Terminal className="size-4 shrink-0 animate-pulse" aria-hidden />
        <span className="animate-pulse">
          postgres@browser:~$ executing query...
        </span>
      </div>
    </AnimatedReveal>
  );
}
