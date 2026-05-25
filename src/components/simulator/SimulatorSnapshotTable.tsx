import { cn } from "../../lib/utils/cn";
import type { StageDiff, RowStatus, TrackedRow } from "../../lib/simulator/types/snapshotTypes";

type Props = {
  rows: TrackedRow[];
  /** Diff between the previous stage and this stage. Null for the first stage. */
  diff?: StageDiff | null;
  /** When true, hidden columns from the diff are rendered as struck-through headers. */
  showHiddenColumns?: boolean;
};

// ── Per-status visual treatment ───────────────────────────────────────────────

const ROW_STATUS_CLASSES: Record<RowStatus, string> = {
  unchanged: "",
  removed:
    "opacity-40 bg-red-500/8 text-red-300 line-through",
  added: "bg-emerald-500/8",
  reordered: "border-l-2 border-sky-500/60",
  "null-introduced": "bg-amber-500/5",
};

const ROW_STATUS_BADGE: Partial<Record<RowStatus, { label: string; classes: string }>> = {
  removed: {
    label: "filtered",
    classes:
      "border-red-500/30 bg-red-500/10 text-red-400",
  },
  added: {
    label: "matched",
    classes:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  reordered: {
    label: "reordered",
    classes: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  },
  "null-introduced": {
    label: "null row",
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
};

export default function SimulatorSnapshotTable({
  rows,
  diff,
  showHiddenColumns = false,
}: Props) {
  // ── Build column list ───────────────────────────────────────────────────────
  const visibleCols = rows.length > 0
    ? Object.keys(rows[0]).filter((k) => k !== "_rowId")
    : [];

  // Columns that existed in the previous stage but were projected away
  const hiddenCols = showHiddenColumns && diff
    ? diff.columnDiffs
        .filter((c) => c.status === "hidden")
        .map((c) => c.column)
    : [];

  const allCols = [...visibleCols, ...hiddenCols];

  // ── Build diff lookup by rowId ──────────────────────────────────────────────
  const diffByRowId = new Map(
    (diff?.rowDiffs ?? []).map((d) => [d.rowId, d])
  );

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (rows.length === 0 && hiddenCols.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-slate-500">
        No rows at this stage.
      </p>
    );
  }

  return (
    <div className="max-h-[320px] overflow-auto rounded-lg border border-slate-700/60">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
          <tr>
            {allCols.map((col) => {
              const isHidden = hiddenCols.includes(col);
              return (
                <th
                  key={col}
                  className={cn(
                    "border-b border-slate-700/80 px-3 py-2 text-left font-semibold whitespace-nowrap",
                    isHidden
                      ? "text-slate-600 line-through opacity-50"
                      : "text-slate-300"
                  )}
                >
                  {col}
                  {isHidden && (
                    <span className="ml-1 text-[9px] font-normal not-italic opacity-70">
                      hidden
                    </span>
                  )}
                </th>
              );
            })}
            {/* Reason column header — only when diff data is present */}
            {diff && (
              <th className="border-b border-slate-700/80 px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                change
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const rowDiff = diffByRowId.get(row._rowId);
            const status: RowStatus = rowDiff?.status ?? "unchanged";
            const badge = ROW_STATUS_BADGE[status];
            const nullCols = new Set(rowDiff?.nullColumns ?? []);

            return (
              <tr
                key={row._rowId}
                data-status={status}
                className={cn(
                  "border-b border-slate-800/60 transition-all duration-200",
                  "hover:bg-slate-800/20",
                  ROW_STATUS_CLASSES[status]
                )}
              >
                {allCols.map((col) => {
                  const value = row[col as keyof typeof row];
                  const isHiddenCol = hiddenCols.includes(col);
                  const isNullIntroduced = nullCols.has(col);

                  return (
                    <td
                      key={col}
                      className={cn(
                        "px-3 py-2 font-mono whitespace-nowrap",
                        isHiddenCol
                          ? "text-slate-700 opacity-30"
                          : "text-slate-300",
                        isNullIntroduced &&
                          "bg-amber-500/15 text-amber-300 rounded"
                      )}
                    >
                      {isHiddenCol ? (
                        <span className="italic text-slate-700">—</span>
                      ) : value === null || value === undefined ? (
                        <span
                          className={cn(
                            "italic",
                            isNullIntroduced
                              ? "text-amber-400 font-semibold"
                              : "text-orange-400/80"
                          )}
                        >
                          NULL
                        </span>
                      ) : (
                        String(value)
                      )}
                    </td>
                  );
                })}

                {/* Change badge + reason */}
                {diff && (
                  <td className="px-3 py-2 whitespace-nowrap">
                    {badge && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          badge.classes
                        )}
                        title={rowDiff?.reason}
                      >
                        {badge.label}
                      </span>
                    )}
                    {rowDiff?.reason && status !== "unchanged" && (
                      <span className="ml-2 text-[10px] text-slate-500 italic">
                        {rowDiff.reason}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
