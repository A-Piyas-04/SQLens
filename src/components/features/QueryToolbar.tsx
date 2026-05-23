import { Play, RotateCcw } from "lucide-react";

import Button from "../common/Button";
import { cn } from "../../lib/utils/cn";

type Props = {
  isRunning: boolean;
  hasSelection: boolean;
  onRun: () => void;
  onReset: () => void;
  /** Compact row for the SQL editor panel header */
  variant?: "header" | "default";
};

export default function QueryToolbar({
  isRunning,
  hasSelection,
  onRun,
  onReset,
  variant = "default",
}: Props) {
  const runLabel = isRunning
    ? hasSelection
      ? "Running…"
      : "Running…"
    : hasSelection
      ? "Run Selection"
      : "Run Query";

  const buttons = (
    <div className={cn("flex items-center gap-2", variant === "header" && "shrink-0")}>
      <Button
        variant="primary"
        size={variant === "header" ? "sm" : "md"}
        onClick={onRun}
        disabled={isRunning}
        className={variant === "default" ? "sm:min-w-[168px]" : undefined}
      >
        <Play className="size-3.5" aria-hidden />
        {runLabel}
      </Button>

      <Button
        variant="danger"
        size={variant === "header" ? "sm" : "md"}
        onClick={onReset}
        disabled={isRunning}
      >
        <RotateCcw className="size-3.5" aria-hidden />
        Reset DB
      </Button>
    </div>
  );

  if (variant === "header") {
    return buttons;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row">{buttons}</div>

      <p className="text-xs">
        {hasSelection ? (
          <span className="text-amber-400/80">
            ● Selection active — only selected SQL will run
          </span>
        ) : (
          <span className="text-slate-600">
            Ctrl+Enter to run · select SQL to run only that part
          </span>
        )}
      </p>
    </div>
  );
}

/** Hint shown below the SQL editor when using header toolbar layout */
export function QueryToolbarHint({ hasSelection }: { hasSelection: boolean }) {
  return (
    <p className="mt-2 text-xs">
      {hasSelection ? (
        <span className="text-amber-400/80">
          ● Selection active — only selected SQL will run
        </span>
      ) : (
        <span className="text-slate-600">
          Ctrl+Enter to run · select SQL to run only that part
        </span>
      )}
    </p>
  );
}
