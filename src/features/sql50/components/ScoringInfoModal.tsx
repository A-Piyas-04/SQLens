import { X } from "lucide-react";
import { useEffect } from "react";

import Button from "../../../components/common/Button";
import {
  BASE_SCORE,
  FAILED_ATTEMPT_PENALTY,
  HINT_PENALTY,
  SOLUTION_VIEWED_PENALTY,
} from "../../../lib/practice/scoring";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const PENALTIES = [
  { label: "Each hint unlocked", points: HINT_PENALTY },
  {
    label: "Each wrong submission before your first correct one",
    points: FAILED_ATTEMPT_PENALTY,
  },
  {
    label: "Opening the solution before solving",
    points: SOLUTION_VIEWED_PENALTY,
  },
];

export default function ScoringInfoModal({ isOpen, onClose }: Props) {
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
        aria-label="Close scoring info"
        onClick={onClose}
      />
      <div
        className="retro-panel fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,36rem)] w-[min(calc(100vw-2rem),36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-surface-elevated p-5 scrollbar-thin sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoring-modal-title"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2
            id="scoring-modal-title"
            className="font-display text-lg font-semibold text-ink"
          >
            How Scoring Works
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
            Problem score
          </h3>
          <p className="mb-2 text-sm leading-relaxed text-ink-secondary">
            Every problem starts at{" "}
            <span className="font-medium text-ink">{BASE_SCORE}</span> points.
            When your submission is accepted, points are deducted for the help
            you used along the way:
          </p>
          <ul className="space-y-1.5 rounded-sm border border-line bg-surface-inset p-3 text-sm">
            {PENALTIES.map(({ label, points }) => (
              <li key={label} className="flex items-start justify-between gap-3">
                <span className="text-ink-secondary">{label}</span>
                <span className="shrink-0 font-mono font-medium text-danger-ink">
                  −{points}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-muted">
            The score never drops below 0.
          </p>
        </section>

        <section className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Best score &amp; average
          </h3>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Only your best score on each problem is kept, so re-solving can only
            raise it. <span className="font-medium text-ink">Avg score</span> is
            the average of your best scores across solved problems — unsolved
            problems don&apos;t pull it down.
          </p>
        </section>

        <section className="mb-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Why it exists
          </h3>
          <p className="text-sm leading-relaxed text-ink-secondary">
            The solved count shows <em>what</em> you finished; the score shows{" "}
            <em>how independently</em> you finished it. It&apos;s a nudge to
            reason through a problem on your own before reaching for hints or
            the solution.
          </p>
        </section>

        <Button type="button" variant="primary" size="sm" onClick={onClose}>
          Got it
        </Button>
      </div>
    </>
  );
}
