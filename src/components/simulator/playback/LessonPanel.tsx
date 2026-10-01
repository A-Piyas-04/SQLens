import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import type { SimulatorSnapshot, StageDiff } from "../../../lib/simulator";
import { STAGE_ACCENT, STAGE_COLORS, STAGE_HINTS, STAGE_ICONS, STAGE_SUBTITLES, diffRowCounts } from "../stageConstants";

export const LESSON_PANEL_ID = "simulator-lesson-panel";

type Props = {
  snapshot: SimulatorSnapshot;
  prevSnapshot: SimulatorSnapshot | null;
  diff: StageDiff | null;
  showRowIds: boolean;
  onToggleRowIds: (next: boolean) => void;
  /** Sidebar variant only: collapsed to a compact rail. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Distinct id per instance (desktop sidebar vs mobile drawer). */
  panelId?: string;
};

export default function LessonPanel({
  snapshot,
  prevSnapshot,
  diff,
  showRowIds,
  onToggleRowIds,
  collapsed = false,
  onToggleCollapsed,
  panelId = LESSON_PANEL_ID,
}: Props) {
  const Icon = STAGE_ICONS[snapshot.stageType];
  const accent = STAGE_ACCENT[snapshot.stageType];
  const colors = STAGE_COLORS[snapshot.stageType];
  const beforeCount = prevSnapshot?.rowCount ?? snapshot.rowCount;
  const afterCount = snapshot.rowCount;
  const counts = diffRowCounts(diff);
  const changeCount = counts.removed + counts.added + counts.reordered + counts.nullRows + counts.hiddenCols;

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

  const toggle = onToggleCollapsed && (
    <button
      type="button"
      onClick={onToggleCollapsed}
      aria-expanded={!collapsed}
      aria-controls={panelId}
      aria-label={collapsed ? "Expand lesson panel" : "Collapse lesson panel"}
      title={collapsed ? "Expand lesson panel" : "Collapse lesson panel"}
      className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-line bg-surface-muted text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
    >
      {collapsed ? <ChevronLeft className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
    </button>
  );

  return (
    <aside
      data-lesson-panel
      data-collapsed={collapsed || undefined}
      className={cn("flex h-full flex-col border-l border-line bg-surface-raised", accent.border)}
    >
      {collapsed && (
        <div data-lesson-rail className="flex h-full flex-col items-center gap-3 py-3">
          {toggle}
          <Icon className={cn("size-5", colors.icon)} aria-hidden />
          <span className="pb-rail-label text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Lesson</span>
          {changeCount > 0 && (
            <span
              className="rounded-full border border-line bg-surface-muted px-1.5 text-[10px] tabular-nums text-ink-secondary"
              title={`${changeCount} changes at this stage`}
            >
              {changeCount}
            </span>
          )}
        </div>
      )}

      {/* Content stays mounted while collapsed so nothing is lost. */}
      <div id={panelId} hidden={collapsed} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-start gap-2 border-b border-line p-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Icon className={cn("size-5", colors.icon)} aria-hidden />
              <p className={cn("text-xs font-semibold uppercase tracking-wider", colors.icon)}>{snapshot.stageType}</p>
            </div>
            <p className="text-xs text-ink-muted">{STAGE_SUBTITLES[snapshot.stageType]}</p>
          </div>
          {toggle}
        </div>

        <section className="space-y-4 p-4">
          <div>
            <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">What Happened</h4>
            <p className="text-sm leading-relaxed text-ink">{snapshot.annotation}</p>
          </div>

          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Row Changes</h4>
            <div className="mb-2 flex items-center justify-between text-xs text-ink-secondary">
              <span>Before: {beforeCount}</span>
              <span className="font-semibold text-ink">After: {afterCount}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full bg-emerald-500/70" style={{ width: `${keptRatio}%` }} />
              {removedRatio > 0 && <div className="h-full -mt-2 bg-rose-500/60" style={{ width: `${removedRatio}%`, marginLeft: `${keptRatio}%` }} />}
            </div>
            <p className={cn("mt-2 text-xs", counts.added > 0 ? "text-emerald-700" : counts.removed > 0 ? "text-rose-700" : "text-ink-muted")}>
              {rowChangeLabel}
            </p>
          </div>

          <details open className="group">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              What To Notice
            </summary>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-secondary">
              {STAGE_HINTS[snapshot.stageType].map((hint) => (
                <li key={hint} className="leading-relaxed">• {hint}</li>
              ))}
            </ul>
          </details>

          <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-line bg-surface-muted px-3 py-2 text-xs text-ink-secondary">
            <input
              type="checkbox"
              checked={showRowIds}
              onChange={(event) => onToggleRowIds(event.target.checked)}
              className="rounded border-line-strong bg-surface-raised text-accent"
            />
            Show row IDs
          </label>
        </section>
      </div>
    </aside>
  );
}
