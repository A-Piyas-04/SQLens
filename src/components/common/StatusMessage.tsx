import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "../../lib/utils/cn";
import AnimatedReveal from "./AnimatedReveal";

type Variant = "error" | "success";

type Props = {
  variant: Variant;
  message: string;
};

const styles: Record<Variant, string> = {
  error: "border-danger-ink text-danger-ink",
  success: "border-success-ink text-success-ink",
};

/** Compact status tag — sized to its message, not a full-width tinted band. */
export default function StatusMessage({ variant, message }: Props) {
  return (
    <AnimatedReveal>
      <div
        className={cn(
          "inline-flex w-fit max-w-full items-start gap-2 border-2 bg-surface-elevated px-3 py-2 font-mono text-xs shadow-[2px_2px_0_0_currentColor]",
          styles[variant]
        )}
        role="status"
      >
        {variant === "error" ? (
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <p className="leading-relaxed text-ink-secondary">{message}</p>
      </div>
    </AnimatedReveal>
  );
}
