import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Button from "../common/Button";
import SimulatorSnapshotTable from "./SimulatorSnapshotTable";
import SimulatorJoinCanvas from "./SimulatorJoinCanvas";
import { cn } from "../../lib/utils/cn";
import type { SimulatorSnapshot, StageDiff } from "../../lib/simulator/types/snapshotTypes";
import StageStepList from "./StageStepList";
import StageEntryBanner from "./playback/StageEntryBanner";
import { STAGE_COLORS, STAGE_ICONS } from "./stageConstants";

type Props = {
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
};

export default function SimulatorSnapshotViewer({ snapshots, diffs }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState<"before" | "after">("after");
  const cardRef = useRef<HTMLDivElement>(null);

  const active = snapshots[activeIndex];
  if (!active) return null;

  const colors = STAGE_COLORS[active.stageType];
  const Icon = STAGE_ICONS[active.stageType];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === snapshots.length - 1;

  const currentDiff = activeIndex > 0 ? diffs[activeIndex - 1] : null;
  const hasDiff =
    currentDiff !== null &&
    currentDiff.rowDiffs.some((d) => d.status !== "unchanged");

  const prevSnapshot = activeIndex > 0 ? snapshots[activeIndex - 1] : null;
  const removedRows =
    hasDiff && prevSnapshot
      ? prevSnapshot.rows.filter((r) =>
          currentDiff?.rowDiffs.some(
            (d) => d.rowId === r._rowId && d.status === "removed"
          )
        )
      : [];

  const showRemovedInline =
    active.stageType === "WHERE" ||
    active.stageType === "HAVING" ||
    active.stageType === "LIMIT";
  const displayRows = showRemovedInline
    ? [...active.rows, ...removedRows]
    : active.rows;

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
    <div className="flex gap-3">
      <aside className="hidden w-40 shrink-0 rounded-lg border border-slate-700/50 bg-slate-900/40 p-2 lg:block">
        <StageStepList snapshots={snapshots} diffs={diffs} activeIndex={activeIndex} onSelect={navigate} />
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <div
          ref={cardRef}
          className={cn(
            "relative overflow-hidden rounded-xl border transition-all duration-150 ease-out",
            colors.border
          )}
        >
          <StageEntryBanner stageType={active.stageType} animationKey={activeIndex} />
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
              <p className="mt-0.5 text-base font-medium text-slate-200">
                {active.annotation}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-md border border-slate-700/60">
              <button
                onClick={() => setViewMode("before")}
                className={cn(
                  "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  viewMode === "before" ? "bg-slate-700/80 text-slate-100" : "bg-slate-900/40 text-slate-400"
                )}
              >
                Before
              </button>
              <button
                onClick={() => setViewMode("after")}
                className={cn(
                  "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  viewMode === "after" ? "bg-slate-700/80 text-slate-100" : "bg-slate-900/40 text-slate-400"
                )}
              >
                After
              </button>
            </div>
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

        {/* JOIN canvas — cause before effect */}
        {active.stageType === "JOIN" && active.rightTableRows && fromSnapshot && (
          <div className="border-b border-slate-800/60 px-4 pb-4 pt-4">
            <SimulatorJoinCanvas
              leftRows={fromSnapshot.rows}
              rightRows={active.rightTableRows}
              joinedRows={active.rows}
              joinType={joinType}
            />
          </div>
        )}

        <div className="p-4">
          <SimulatorSnapshotTable
            rows={viewMode === "before" && prevSnapshot ? prevSnapshot.rows : displayRows}
            diff={viewMode === "after" && hasDiff ? currentDiff : null}
            showHiddenColumns={active.stageType === "SELECT" && !!prevSnapshot}
          />
        </div>
        </div>

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
    </div>
  );
}
