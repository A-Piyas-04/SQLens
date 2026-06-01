import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "../../lib/utils/cn";
import AnimatedReveal from "./AnimatedReveal";

type Variant = "error" | "success";

type Props = {
  variant: Variant;
  message: string;
};

const styles: Record<Variant, string> = {
  error: "border-danger-ink bg-danger-surface text-danger-ink",
  success: "border-success-ink bg-success-surface text-success-ink",
};

export default function StatusMessage({ variant, message }: Props) {
  return (
    <AnimatedReveal>
      <div
        className={cn(
          "flex items-start gap-3 rounded-sm border p-4 text-sm",
          styles[variant]
        )}
        role="status"
      >
        {variant === "error" ? (
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <p className="leading-relaxed">{message}</p>
      </div>
    </AnimatedReveal>
  );
}
