import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import type { SimulatorSnapshot, StageDiff } from "../../../lib/simulator";
import type { SimulatorStageType } from "../../../lib/simulator";

type Props = {
  snapshot: SimulatorSnapshot;
  diff: StageDiff | null;
  /** Incremented on every stage navigation — resets the dismissed state */
  animationKey: number;
};

function buildDiffSummary(diff: StageDiff, stageType: SimulatorStageType): string | null {
  const removed   = diff.rowDiffs.filter((d) => d.status === "removed").length;
  const added     = diff.rowDiffs.filter((d) => d.status === "added").length;
  const reordered = diff.rowDiffs.filter((d) => d.status === "reordered").length;
  const nullRows  = diff.rowDiffs.filter((d) => d.status === "null-introduced").length;
  const hidden    = diff.columnDiffs.filter((c) => c.status === "hidden").length;

  const parts: string[] = [];

  switch (stageType) {
    case "WHERE":
    case "HAVING":
      if (removed > 0)
        parts.push(`${removed} row${removed !== 1 ? "s" : ""} removed`);
      break;
    case "JOIN":
      if (added > 0)
        parts.push(`${added} row${added !== 1 ? "s" : ""} matched`);
      if (nullRows > 0)
        parts.push(`${nullRows} row${nullRows !== 1 ? "s" : ""} got NULLs (no match)`);
      break;
    case "SELECT":
      if (hidden > 0)
        parts.push(`${hidden} column${hidden !== 1 ? "s" : ""} hidden`);
      break;
    case "ORDER_BY":
      if (reordered > 0)
        parts.push(`${reordered} row${reordered !== 1 ? "s" : ""} reordered`);
      break;
    case "LIMIT":
      if (removed > 0)
        parts.push(`${removed} row${removed !== 1 ? "s" : ""} dropped`);
      break;
    default:
      break;
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

const STAGE_ACCENT: Record<SimulatorStageType, { border: string; dot: string }> = {
  FROM:     { border: "border-l-blue-500/60",   dot: "bg-blue-400"   },
  JOIN:     { border: "border-l-purple-500/60", dot: "bg-purple-400" },
  WHERE:    { border: "border-l-amber-500/60",  dot: "bg-amber-400"  },
  GROUP_BY: { border: "border-l-violet-500/60", dot: "bg-violet-400" },
  HAVING:   { border: "border-l-orange-500/60", dot: "bg-orange-400" },
  SELECT:   { border: "border-l-emerald-500/60",dot: "bg-emerald-400"},
  ORDER_BY: { border: "border-l-sky-500/60",    dot: "bg-sky-400"    },
  LIMIT:    { border: "border-l-rose-500/60",   dot: "bg-rose-400"   },
};

export default function StageAnnotation({ snapshot, diff, animationKey }: Props) {
  const [visible, setVisible] = useState(true);

  // Reappear on every stage change
  useEffect(() => {
    setVisible(true);
  }, [animationKey]);

  if (!visible) return null;

  const diffSummary = diff !== null ? buildDiffSummary(diff, snapshot.stageType) : null;
  const accent = STAGE_ACCENT[snapshot.stageType];

  return (
    <div
      key={animationKey}
      className={cn(
        // Floating card — positioned by PlaybackStage's wrapper
        "absolute bottom-5 right-5 z-20",
        "w-72 rounded-xl border border-slate-700/60 border-l-2 bg-slate-900/90 shadow-xl shadow-black/40 backdrop-blur-md",
        "animate-fade-in-up",
        accent.border
      )}
      role="status"
      aria-live="polite"
    >
      {/* Dismiss button */}
      <button
        aria-label="Dismiss explanation"
        onClick={() => setVisible(false)}
        className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-700/60 hover:text-slate-300"
      >
        <X className="size-3" aria-hidden />
      </button>

      <div className="px-4 py-3 pr-8">
        {/* Stage label dot */}
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", accent.dot)} aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {snapshot.label}
          </span>
        </div>

        <p className="text-sm font-medium leading-snug text-slate-200">
          {snapshot.annotation}
        </p>

        {diffSummary && (
          <p className="mt-1.5 text-xs text-slate-400">{diffSummary}</p>
        )}
      </div>
    </div>
  );
}
