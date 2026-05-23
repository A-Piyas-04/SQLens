import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "../../lib/utils/cn";
import AnimatedReveal from "./AnimatedReveal";

type Variant = "error" | "success";

type Props = {
  variant: Variant;
  message: string;
};

const styles: Record<Variant, string> = {
  error: "border-red-800/60 bg-red-950/50 text-red-200",
  success: "border-emerald-800/60 bg-emerald-950/40 text-emerald-200",
};

export default function StatusMessage({ variant, message }: Props) {
  return (
    <AnimatedReveal>
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border p-4 text-sm",
          "shadow-md shadow-slate-950/20",
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
