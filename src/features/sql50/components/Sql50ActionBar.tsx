import { Cpu, Play, RotateCcw, Send } from "lucide-react";

import Button from "../../../components/common/Button";
import { cn } from "../../../lib/utils/cn";

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
  /** Stack vertically in the editor rail (desktop). */
  rail?: boolean;
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
  rail = false,
}: Props) {
  return (
    <div
      className={cn(
        "space-y-2",
        rail && "flex h-full min-h-0 flex-col"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          rail ? "flex-col" : "flex-wrap"
        )}
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(
            rail && "w-full justify-center",
            lastRunSucceeded &&
              !isRunning &&
              !isPreparingSimulation &&
              "border-accent bg-accent-soft/50 text-accent-ink hover:border-accent hover:bg-accent-soft"
          )}
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
          className={cn(
            rail && "w-full justify-center",
            !isRunning && "shadow-sm ring-1 ring-accent/25"
          )}
          onClick={onRun}
          disabled={isRunning}
        >
          <Play className="size-3.5" aria-hidden />
          {runLabel}
        </Button>
        <Button
          type="button"
          variant="accent-secondary"
          size="sm"
          className={cn(rail && "w-full justify-center")}
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
          className={cn(
            "text-danger-ink hover:bg-danger-surface",
            rail && "w-full justify-center"
          )}
          onClick={onReset}
          disabled={isRunning}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset DB
        </Button>
      </div>
      <p
        className={cn(
          "text-[11px] text-ink-muted",
          rail && "mt-auto space-y-1.5 text-center leading-relaxed"
        )}
      >
        {rail ? (
          <>
            <span className="block">
              <kbd className="rounded border border-line bg-surface-muted px-1 py-0.5 font-mono text-[10px]">
                Ctrl+Enter
              </kbd>{" "}
              run
            </span>
            <span className="block">
              <kbd className="rounded border border-line bg-surface-muted px-1 py-0.5 font-mono text-[10px]">
                Ctrl+Shift+Enter
              </kbd>{" "}
              submit
            </span>
          </>
        ) : (
          <>
            <kbd className="rounded border border-line bg-surface-muted px-1 py-0.5 font-mono text-[10px]">
              Ctrl+Enter
            </kbd>{" "}
            run ·{" "}
            <kbd className="rounded border border-line bg-surface-muted px-1 py-0.5 font-mono text-[10px]">
              Ctrl+Shift+Enter
            </kbd>{" "}
            submit
          </>
        )}
      </p>
    </div>
  );
}
