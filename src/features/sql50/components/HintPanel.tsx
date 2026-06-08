import { Lightbulb } from "lucide-react";

import Button from "../../../components/common/Button";
import Panel from "../../../components/common/Panel";

type Props = {
  hints: string[];
  hintsUsed: number;
  onUnlockHint: () => void;
};

export default function HintPanel({ hints, hintsUsed, onUnlockHint }: Props) {
  const allUnlocked = hintsUsed >= hints.length;
  const visibleHints = hints.slice(0, hintsUsed);

  return (
    <Panel
      title="Hints"
      action={
        !allUnlocked ? (
          <Button type="button" variant="secondary" size="sm" onClick={onUnlockHint}>
            <Lightbulb className="size-3.5" aria-hidden />
            Reveal hint {hintsUsed + 1}
          </Button>
        ) : null
      }
    >
      {visibleHints.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Stuck? Reveal hints one at a time. Each hint costs 10 points from your
          score.
        </p>
      ) : (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
          {visibleHints.map((hint, index) => (
            <li key={hint} className="leading-relaxed">
              <span className="font-medium text-ink-muted">Hint {index + 1}:</span>{" "}
              {hint}
            </li>
          ))}
        </ol>
      )}
      {allUnlocked && hints.length > 0 ? (
        <p className="mt-3 text-xs text-ink-muted">All hints revealed.</p>
      ) : null}
    </Panel>
  );
}
