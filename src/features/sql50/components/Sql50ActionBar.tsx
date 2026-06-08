import { Cpu, Play, RotateCcw, Send } from "lucide-react";

import Button from "../../../components/common/Button";

type Props = {
  runLabel: string;
  isRunning: boolean;
  isSubmitting: boolean;
  lastRunSucceeded: boolean;
  isPreparingSimulation: boolean;
  onPlaySimulation: () => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
};

export default function Sql50ActionBar({
  runLabel,
  isRunning,
  isSubmitting,
  lastRunSucceeded,
  isPreparingSimulation,
  onPlaySimulation,
  onRun,
  onSubmit,
  onReset,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!lastRunSucceeded || isRunning || isPreparingSimulation}
          onClick={onPlaySimulation}
          title={
            lastRunSucceeded
              ? "Open visual simulator for the last successful query"
              : "Run a query successfully first"
          }
        >
          <Cpu className="size-3.5" aria-hidden />
          {isPreparingSimulation ? "Preparing…" : "Play Simulation"}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onRun}
          disabled={isRunning}
        >
          <Play className="size-3.5" aria-hidden />
          {runLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isSubmitting || isRunning}
          onClick={onSubmit}
        >
          <Send className="size-3.5" aria-hidden />
          {isSubmitting ? "Submitting…" : "Submit"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-danger-ink hover:bg-danger-surface"
          onClick={onReset}
          disabled={isRunning}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset DB
        </Button>
      </div>
      <p className="text-[11px] text-ink-muted">
        <kbd className="rounded border border-line bg-surface-muted px-1 py-0.5 font-mono text-[10px]">
          Ctrl+Enter
        </kbd>{" "}
        run ·{" "}
        <kbd className="rounded border border-line bg-surface-muted px-1 py-0.5 font-mono text-[10px]">
          Ctrl+Shift+Enter
        </kbd>{" "}
        submit
      </p>
    </div>
  );
}
