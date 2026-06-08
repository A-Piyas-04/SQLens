import { Lightbulb } from "lucide-react";

import Button from "../../../components/common/Button";
import Panel from "../../../components/common/Panel";

type Props = {
  hints: string[];
  hintsUsed: number;
  onUnlockHint: () => void;
  embedded?: boolean;
};

export default function HintPanel({
  hints,
  hintsUsed,
  onUnlockHint,
  embedded = false,
}: Props) {
  const allUnlocked = hintsUsed >= hints.length;
  const visibleHints = hints.slice(0, hintsUsed);

  const revealButton = !allUnlocked ? (
    <Button type="button" variant="secondary" size="sm" onClick={onUnlockHint}>
      <Lightbulb className="size-3.5" aria-hidden />
      Hint {hintsUsed + 1}
    </Button>
  ) : null;

  const body = (
    <>
      {visibleHints.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Reveal hints one at a time (−10 pts each).
        </p>
      ) : (
        <ol className="list-decimal space-y-2 pl-4 text-sm text-ink-secondary">
          {visibleHints.map((hint) => (
            <li key={hint} className="leading-relaxed">
              {hint}
            </li>
          ))}
        </ol>
      )}
      {allUnlocked && hints.length > 0 ? (
        <p className="mt-2 text-xs text-ink-muted">All hints revealed.</p>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink-muted">Hints</span>
          {revealButton}
        </div>
        {body}
      </div>
    );
  }

  return (
    <Panel title="Hints" action={revealButton}>
      {body}
    </Panel>
  );
}
