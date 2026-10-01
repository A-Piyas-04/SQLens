import { Check } from "lucide-react";

import { cn } from "../../lib/utils/cn";
import type { SimulatorSnapshot, StageDiff } from "../../lib/simulator";
import { STAGE_COLORS, diffRowCounts } from "./stageConstants";
import StageGlyph from "./StageGlyph";

type Props = {
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
};

/** Execution stages as a numbered timeline: done · current · pending nodes on one rail. */
export default function StageStepList({
  snapshots,
  diffs,
  activeIndex,
  onSelect,
  className,
}: Props) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {snapshots.map((snap, index) => {
        const incomingDiff = index > 0 ? diffs[index - 1] ?? null : null;
        const { removed, added } = diffRowCounts(incomingDiff);
        const diffValue = added - removed;
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        const isFirst = index === 0;
        const isLast = index === snapshots.length - 1;

        return (
          <li key={snap.stageId}>
            <button
              onClick={() => onSelect(index)}
              aria-current={isActive ? "step" : undefined}
              className="group grid w-full grid-cols-[24px_minmax(0,1fr)_auto] items-stretch gap-2.5 px-1 text-left focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span className="relative flex min-h-10 items-center justify-center">
                <span
                  className={cn(
                    "absolute left-1/2 w-px -translate-x-1/2 bg-line-strong",
                    isFirst ? "top-1/2" : "top-0",
                    isLast ? "bottom-1/2" : "bottom-0"
                  )}
                  aria-hidden
                />
                {isActive ? (
                  <StageGlyph stageType={snap.stageType} className="relative" />
                ) : isCompleted ? (
                  <span className="relative flex size-[18px] items-center justify-center rounded-full bg-ink text-surface">
                    <Check className="size-3" aria-hidden />
                  </span>
                ) : (
                  <span className="relative flex size-[18px] items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-[9px] text-ink-muted">
                    {index + 1}
                  </span>
                )}
              </span>

              <span className="min-w-0 self-center py-1.5">
                <span
                  className={cn(
                    "block truncate text-[11px] font-semibold leading-tight tracking-wide",
                    isActive ? STAGE_COLORS[snap.stageType].icon : "text-ink-secondary group-hover:text-ink",
                    !isActive && "group-hover:underline group-hover:underline-offset-2"
                  )}
                >
                  {snap.stageType.replace("_", " ")}
                </span>
                <span className="block font-mono text-[10px] text-ink-muted">{snap.rowCount} rows</span>
              </span>

              {index > 0 && diffValue !== 0 ? (
                <span
                  className={cn(
                    "self-center font-mono text-[10px] font-semibold tabular-nums",
                    diffValue > 0 ? "text-success-ink" : "text-danger-ink"
                  )}
                >
                  {diffValue > 0 ? `+${diffValue}` : `−${Math.abs(diffValue)}`}
                </span>
              ) : (
                <span />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
