import { useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  GitMerge,
  Hash,
  Layers,
  Table2,
  type LucideIcon,
} from "lucide-react";

import Button from "../common/Button";
import SimulatorSnapshotTable from "./SimulatorSnapshotTable";
import { cn } from "../../lib/utils/cn";
import type { SimulatorSnapshot } from "../../lib/simulator/snapshotTypes";
import type { SimulatorStageType } from "../../lib/simulator/simulatorTypes";

const STAGE_ICONS: Record<SimulatorStageType, LucideIcon> = {
  FROM: Table2,
  JOIN: GitMerge,
  WHERE: Filter,
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
};

export default function SimulatorSnapshotViewer({ snapshots }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const active = snapshots[activeIndex];
  if (!active) return null;

  const colors = STAGE_COLORS[active.stageType];
  const Icon = STAGE_ICONS[active.stageType];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === snapshots.length - 1;

  return (
    <div className="space-y-4">
      {/* Stage pills nav */}
      <div className="flex flex-wrap gap-2">
        {snapshots.map((snapshot, i) => {
          const pillColors = STAGE_COLORS[snapshot.stageType];
          const PillIcon = STAGE_ICONS[snapshot.stageType];
          const isActive = i === activeIndex;

          return (
            <button
              key={snapshot.stageId}
              onClick={() => setActiveIndex(i)}
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
            </button>
          );
        })}
      </div>

      {/* Active snapshot card */}
      <div
        className={cn(
          "rounded-xl border",
          colors.border,
          "overflow-hidden"
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

          <span className="shrink-0 rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-[11px] font-mono text-slate-400">
            {active.rowCount} {active.rowCount === 1 ? "row" : "rows"}
          </span>
        </div>

        {/* Generated SQL */}
        <div className="border-b border-slate-800/60 bg-slate-950/40 px-4 py-2.5">
          <p className="font-mono text-[11px] leading-relaxed text-slate-500 break-all">
            {active.sql}
          </p>
        </div>

        {/* Result table */}
        <div className="p-4">
          <SimulatorSnapshotTable rows={active.rows} />
        </div>
      </div>

      {/* Previous / Next navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
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
          onClick={() =>
            setActiveIndex((i) => Math.min(snapshots.length - 1, i + 1))
          }
          disabled={isLast}
        >
          Next
          <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
