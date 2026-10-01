import { Play, X } from "lucide-react";
import { useEffect } from "react";

import Button from "../../../components/common/Button";
import type { Sql50Problem } from "../types/sql50";

type Props = {
  problem: Sql50Problem;
  isOpen: boolean;
  onClose: () => void;
  onVisualize: (sql: string) => void;
};

export default function SolutionModal({
  problem,
  isOpen,
  onClose,
  onVisualize,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="retro-scrim fixed inset-0 z-50"
        aria-label="Close solution"
        onClick={onClose}
      />
      <div
        className="retro-panel fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,36rem)] w-[min(calc(100vw-2rem),40rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-surface-elevated p-5 scrollbar-thin sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="solution-modal-title"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2
            id="solution-modal-title"
            className="font-display text-lg font-semibold text-ink"
          >
            Official Solution
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-danger-ink bg-danger-ink p-1 text-white transition-colors hover:border-red-800 hover:bg-red-800"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <section className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Solution
          </h3>
          <pre className="overflow-x-auto rounded-sm border border-line bg-surface-inset p-3 font-mono text-sm text-ink">
            {problem.officialSolution}
          </pre>
        </section>

        <section className="mb-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Explanation
          </h3>
          <p className="text-sm leading-relaxed text-ink-secondary">
            {problem.explanation}
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onVisualize(problem.officialSolution);
              onClose();
            }}
          >
            <Play className="size-3.5" aria-hidden />
            Visualize Solution
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          Viewing the solution before solving costs 20 points from your best
          score.
        </p>
      </div>
    </>
  );
}
