import { Check } from "lucide-react";

import { cn } from "../../lib/utils/cn";
import type { SimulatorSnapshot, StageDiff } from "../../lib/simulator";
import { STAGE_COLORS, STAGE_ICONS, diffRowCounts } from "./stageConstants";

type Props = {
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
};

export default function StageStepList({
  snapshots,
  diffs,
  activeIndex,
  onSelect,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {snapshots.map((snap, index) => {
        const colors = STAGE_COLORS[snap.stageType];
        const Icon = STAGE_ICONS[snap.stageType];
        const incomingDiff = index > 0 ? diffs[index - 1] ?? null : null;
        const { removed, added } = diffRowCounts(incomingDiff);
        const diffValue = added - removed;
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        const isPending = index > activeIndex;

        return (
          <button
            key={snap.stageId}
            onClick={() => onSelect(index)}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "group flex items-center gap-2 rounded-sm border border-transparent px-2.5 py-2 text-left transition-colors",
              isActive && cn(colors.activeRow, colors.border),
              isCompleted && "text-ink-muted hover:bg-surface-muted",
              isPending && "text-ink-muted hover:bg-surface-muted"
            )}
          >
            <span className={cn("flex size-5 shrink-0 items-center justify-center", isActive ? colors.icon : "text-ink-muted")}>
              {isCompleted ? <Check className="size-3.5" aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold leading-tight">{snap.stageType}</span>
              <span className="block text-[10px] text-ink-muted">{snap.rowCount} rows</span>
            </span>

            {index > 0 && diffValue !== 0 && (
              <span
                className={cn(
                  "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
                  diffValue > 0
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border-rose-500/30 bg-rose-500/15 text-rose-300"
                )}
              >
                {diffValue > 0 ? `+${diffValue}` : diffValue}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
