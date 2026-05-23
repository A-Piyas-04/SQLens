import { Play, RotateCcw } from "lucide-react";

import Button from "../common/Button";

type Props = {
  isRunning: boolean;
  hasSelection: boolean;
  onRun: () => void;
  onReset: () => void;
};

export default function QueryToolbar({
  isRunning,
  hasSelection,
  onRun,
  onReset,
}: Props) {
  const runLabel = isRunning
    ? hasSelection
      ? "Running selection…"
      : "Running…"
    : hasSelection
      ? "Run Selection"
      : "Run Query";

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          onClick={onRun}
          disabled={isRunning}
          className="sm:min-w-[168px]"
        >
          <Play className="size-4" aria-hidden />
          {runLabel}
        </Button>

        <Button variant="danger" onClick={onReset} disabled={isRunning}>
          <RotateCcw className="size-4" aria-hidden />
          Reset DB
        </Button>
      </div>

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
