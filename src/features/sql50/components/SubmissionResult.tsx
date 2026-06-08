import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

import AnimatedReveal from "../../../components/common/AnimatedReveal";
import type { SubmissionResult } from "../../../lib/practice/types";
import { cn } from "../../../lib/utils/cn";

type Props = {
  result: SubmissionResult | null;
};

const verdictConfig = {
  accepted: {
    icon: CheckCircle2,
    className: "border-success-ink bg-success-surface text-success-ink",
    label: "Accepted",
  },
  wrong_answer: {
    icon: XCircle,
    className: "border-amber-300 bg-amber-50 text-amber-900",
    label: "Wrong Answer",
  },
  runtime_error: {
    icon: AlertCircle,
    className: "border-danger-ink bg-danger-surface text-danger-ink",
    label: "Runtime Error",
  },
};

export default function SubmissionResultPanel({ result }: Props) {
  if (!result) return null;

  const config = verdictConfig[result.verdict];
  const Icon = config.icon;

  return (
    <AnimatedReveal>
      <div
        className={cn(
          "rounded-sm border p-4",
          config.className
        )}
        role="status"
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{config.label}</p>
            <p className="mt-1 text-sm leading-relaxed">{result.message}</p>
            {result.comparison && result.comparison.messages.length > 1 ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                {result.comparison.messages.slice(1).map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            ) : null}
            {result.userRowCount !== undefined ? (
              <p className="mt-2 text-xs opacity-80">
                Your query returned {result.userRowCount} row(s).
                {result.expectedRowCount !== undefined
                  ? ` Expected ${result.expectedRowCount}.`
                  : null}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </AnimatedReveal>
  );
}
