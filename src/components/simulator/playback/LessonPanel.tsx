import { useMemo } from "react";
import { cn } from "../../../lib/utils/cn";
import type { SimulatorSnapshot, StageDiff } from "../../../lib/simulator";
import { STAGE_ACCENT, STAGE_COLORS, STAGE_HINTS, STAGE_ICONS, STAGE_SUBTITLES, diffRowCounts } from "../stageConstants";

type Props = {
  snapshot: SimulatorSnapshot;
  prevSnapshot: SimulatorSnapshot | null;
  diff: StageDiff | null;
  showRowIds: boolean;
  onToggleRowIds: (next: boolean) => void;
};

export default function LessonPanel({
  snapshot,
  prevSnapshot,
  diff,
  showRowIds,
  onToggleRowIds,
}: Props) {
  const Icon = STAGE_ICONS[snapshot.stageType];
  const accent = STAGE_ACCENT[snapshot.stageType];
  const colors = STAGE_COLORS[snapshot.stageType];
  const beforeCount = prevSnapshot?.rowCount ?? snapshot.rowCount;
  const afterCount = snapshot.rowCount;
  const counts = diffRowCounts(diff);

  const keptRatio = beforeCount > 0 ? Math.min(100, Math.round((afterCount / beforeCount) * 100)) : 100;
  const removedRatio = Math.max(0, 100 - keptRatio);

  const rowChangeLabel = useMemo(() => {
    if (snapshot.stageType === "JOIN" && counts.added > 0) {
      return `+${counts.added} rows added`;
    }
    if (counts.removed > 0) {
      return `${counts.removed} rows removed`;
    }
    return "No row count change";
  }, [counts.added, counts.removed, snapshot.stageType]);

  return (
    <aside className={cn("flex h-full flex-col overflow-y-auto border-l border-slate-700/50 bg-slate-900/30", accent.border)}>
      <div className="border-b border-slate-700/50 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Icon className={cn("size-5", colors.icon)} aria-hidden />
          <p className={cn("text-xs font-semibold uppercase tracking-wider", colors.icon)}>{snapshot.stageType}</p>
        </div>
        <p className="text-xs text-slate-400">{STAGE_SUBTITLES[snapshot.stageType]}</p>
      </div>

      <section className="space-y-4 p-4">
        <div>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">What Happened</h4>
          <p className="text-sm leading-relaxed text-slate-200">{snapshot.annotation}</p>
        </div>

        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Row Changes</h4>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
            <span>Before: {beforeCount}</span>
            <span className="pb-count-update font-semibold text-slate-100">After: {afterCount}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-emerald-500/70" style={{ width: `${keptRatio}%` }} />
            {removedRatio > 0 && <div className="h-full -mt-2 bg-rose-500/60" style={{ width: `${removedRatio}%`, marginLeft: `${keptRatio}%` }} />}
          </div>
          <p className={cn("mt-2 text-xs", counts.added > 0 ? "text-emerald-300" : counts.removed > 0 ? "text-rose-300" : "text-slate-500")}>
            {rowChangeLabel}
          </p>
        </div>

        <details open className="group">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            What To Notice
          </summary>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
            {STAGE_HINTS[snapshot.stageType].map((hint) => (
              <li key={hint} className="leading-relaxed">• {hint}</li>
            ))}
          </ul>
        </details>

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-700/60 bg-slate-800/30 px-3 py-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showRowIds}
            onChange={(event) => onToggleRowIds(event.target.checked)}
            className="rounded border-slate-600 bg-slate-900 text-sky-400"
          />
          Show row IDs
        </label>
      </section>
    </aside>
  );
}
