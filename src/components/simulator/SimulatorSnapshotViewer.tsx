import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  ChartBarStacked,
  ChevronLeft,
  ChevronRight,
  Filter,
  Funnel,
  GitMerge,
  Hash,
  Layers,
  Table2,
  type LucideIcon,
} from "lucide-react";

import Button from "../common/Button";
import SimulatorSnapshotTable from "./SimulatorSnapshotTable";
import SimulatorJoinCanvas from "./SimulatorJoinCanvas";
import { cn } from "../../lib/utils/cn";
import type { SimulatorSnapshot, StageDiff } from "../../lib/simulator/types/snapshotTypes";
import type { SimulatorStageType } from "../../lib/simulator/types/simulatorTypes";

const STAGE_ICONS: Record<SimulatorStageType, LucideIcon> = {
  FROM: Table2,
  JOIN: GitMerge,
  WHERE: Filter,
  GROUP_BY: ChartBarStacked,
  HAVING: Funnel,
  SELECT: Layers,
  ORDER_BY: ArrowUpDown,
  LIMIT: Hash,
};

const STAGE_COLORS: Record<
  SimulatorStageType,
  { pill: string; icon: string; border: string; header: string }
> = {
  FROM: {
    pill: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    icon: "text-blue-400",
    border: "border-blue-500/20",
    header: "bg-blue-500/8",
  },
  JOIN: {
    pill: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    icon: "text-purple-400",
    border: "border-purple-500/20",
    header: "bg-purple-500/8",
  },
  WHERE: {
    pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: "text-amber-400",
    border: "border-amber-500/20",
    header: "bg-amber-500/8",
  },
  GROUP_BY: {
    pill: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    icon: "text-violet-400",
    border: "border-violet-500/20",
    header: "bg-violet-500/8",
  },
  HAVING: {
    pill: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    icon: "text-orange-400",
    border: "border-orange-500/20",
    header: "bg-orange-500/8",
  },
  SELECT: {
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
    header: "bg-emerald-500/8",
  },
  ORDER_BY: {
    pill: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    icon: "text-sky-400",
    border: "border-sky-500/20",
    header: "bg-sky-500/8",
  },
  LIMIT: {
    pill: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: "text-rose-400",
    border: "border-rose-500/20",
    header: "bg-rose-500/8",
  },
};

type Props = {
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
};

export default function SimulatorSnapshotViewer({ snapshots, diffs }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const active = snapshots[activeIndex];
  if (!active) return null;

  const colors = STAGE_COLORS[active.stageType];
  const Icon = STAGE_ICONS[active.stageType];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === snapshots.length - 1;

  // Diff entering the current stage (index N is between stage N-1 and N).
  const currentDiff = activeIndex > 0 ? diffs[activeIndex - 1] : null;

  // Determine if there's meaningful diff data to show in the table.
  const hasDiff =
    currentDiff !== null &&
    currentDiff.rowDiffs.some((d) => d.status !== "unchanged");

  // For the WHERE stage, we also want to show removed rows from the previous
  // snapshot so the fade-out effect is visible.
  const prevSnapshot = activeIndex > 0 ? snapshots[activeIndex - 1] : null;
  const removedRows =
    hasDiff && prevSnapshot
      ? prevSnapshot.rows.filter((r) =>
          currentDiff?.rowDiffs.some(
            (d) => d.rowId === r._rowId && d.status === "removed"
          )
        )
      : [];

  // Combine visible rows + removed rows for stages where removal is educational.
  const showRemovedInline =
    active.stageType === "WHERE" ||
    active.stageType === "HAVING" ||
    active.stageType === "LIMIT";
  const displayRows = showRemovedInline
    ? [...active.rows, ...removedRows]
    : active.rows;

  // JOIN canvas data
  const fromSnapshot = snapshots[0]; // FROM is always stage 0
  const joinType = active.stageType === "JOIN"
    ? (active.annotation.match(/Applied (.+?) —/)?.[1] ?? "JOIN")
    : "JOIN";

  function navigate(newIndex: number) {
    if (isAnimating) return;
    setIsAnimating(true);
    const card = cardRef.current;
    if (card) {
      card.classList.add("opacity-0", "translate-y-1");
    }
    setTimeout(() => {
      setActiveIndex(newIndex);
      if (card) {
        card.classList.remove("opacity-0", "translate-y-1");
        card.classList.add("opacity-100", "translate-y-0");
      }
      setIsAnimating(false);
    }, 160);
  }

  // Reset to first stage when snapshots change (new simulation run).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setActiveIndex(0); }, [snapshots]);

  return (
    <div className="space-y-4">
      {/* Stage pills nav */}
      <div className="flex flex-wrap gap-2">
        {snapshots.map((snapshot, i) => {
          const pillColors = STAGE_COLORS[snapshot.stageType];
          const PillIcon = STAGE_ICONS[snapshot.stageType];
          const isActive = i === activeIndex;
          const stageDiff = i > 0 ? diffs[i - 1] : null;
          const removedCount = stageDiff?.rowDiffs.filter(
            (d) => d.status === "removed"
          ).length ?? 0;

          return (
            <button
              key={snapshot.stageId}
              onClick={() => navigate(i)}
              disabled={isAnimating}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                "transition-all duration-150",
                isActive
                  ? pillColors.pill
                  : "border-slate-700/60 bg-slate-800/40 text-slate-500 hover:border-slate-600/60 hover:text-slate-300"
              )}
            >
              <PillIcon className="size-3" aria-hidden />
              {snapshot.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-mono",
                  isActive
                    ? "bg-slate-950/30"
                    : "bg-slate-700/40 text-slate-500"
                )}
              >
                {snapshot.rowCount}
              </span>
              {removedCount > 0 && (
                <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-mono text-red-400">
                  −{removedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active snapshot card */}
      <div
        ref={cardRef}
        className={cn(
          "rounded-xl border overflow-hidden",
          "transition-all duration-150 ease-out",
          colors.border
        )}
      >
        {/* Stage header */}
        <div
          className={cn(
            "flex items-start justify-between gap-3 px-4 py-3",
            colors.header,
            "border-b",
            colors.border
          )}
        >
          <div className="flex items-start gap-2.5">
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", colors.icon)}
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {active.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {active.annotation}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Removed row badge */}
            {removedRows.length > 0 && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-mono text-red-400">
                −{removedRows.length} removed
              </span>
            )}
            <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-[11px] font-mono text-slate-400">
              {active.rowCount} {active.rowCount === 1 ? "row" : "rows"}
            </span>
          </div>
        </div>

        {/* Generated SQL */}
        <div className="border-b border-slate-800/60 bg-slate-950/40 px-4 py-2.5">
          <p className="font-mono text-[11px] leading-relaxed text-slate-500 break-all">
            {active.sql}
          </p>
        </div>

        {/* Result table */}
        <div className="p-4">
          <SimulatorSnapshotTable
            rows={displayRows}
            diff={hasDiff ? currentDiff : null}
            showHiddenColumns={active.stageType === "SELECT" && !!prevSnapshot}
          />
        </div>

        {/* JOIN canvas — only for JOIN stage */}
        {active.stageType === "JOIN" && active.rightTableRows && fromSnapshot && (
          <div className="border-t border-slate-800/60 px-4 pb-4">
            <SimulatorJoinCanvas
              leftRows={fromSnapshot.rows}
              rightRows={active.rightTableRows}
              joinedRows={active.rows}
              joinType={joinType}
            />
          </div>
        )}
      </div>

      {/* Previous / Next navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(Math.max(0, activeIndex - 1))}
          disabled={isFirst || isAnimating}
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Previous
        </Button>

        <span className="text-xs text-slate-600">
          Stage {activeIndex + 1} of {snapshots.length}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(Math.min(snapshots.length - 1, activeIndex + 1))}
          disabled={isLast || isAnimating}
        >
          Next
          <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
