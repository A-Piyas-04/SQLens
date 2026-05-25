import { type CSSProperties, memo } from "react";
import { cn } from "../../../lib/utils/cn";
import type { RowDiff, RowStatus, TrackedRow } from "../../../lib/simulator";

/** Stagger delay between each animated row (ms). Keeps rows from all firing at once. */
const ROW_STAGGER_MS = 55;

type Props = {
  row: TrackedRow;
  columns: string[];
  hiddenColumns: Set<string>;
  rowDiff: RowDiff | undefined;
  /** 0-based position of this row in the displayed list — drives CSS stagger */
  rowIndex: number;
  /** Ref callback for FLIP animation registration */
  rowRef?: (el: HTMLTableRowElement | null) => void;
  /** When true, show the "change" reason column */
  showReason: boolean;
};

const ROW_BG: Record<RowStatus, string> = {
  unchanged:        "",
  removed:          "data-[status=removed]:opacity-25 data-[status=removed]:bg-red-500/8",
  added:            "data-[status=added]:bg-emerald-500/8",
  reordered:        "data-[status=reordered]:border-l-2 data-[status=reordered]:border-l-sky-500/60",
  "null-introduced":"data-[status=null-introduced]:bg-amber-500/5",
};

// Human-friendly label for each status badge
const STATUS_BADGE: Partial<Record<RowStatus, { label: string; cls: string }>> = {
  removed:          { label: "filtered",   cls: "border-red-500/30 bg-red-500/10 text-red-400" },
  added:            { label: "matched",    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  reordered:        { label: "reordered",  cls: "border-sky-500/30 bg-sky-500/10 text-sky-400" },
  "null-introduced":{ label: "null row",   cls: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
};

const PlaybackRow = memo(function PlaybackRow({
  row,
  columns,
  hiddenColumns,
  rowDiff,
  rowIndex,
  rowRef,
  showReason,
}: Props) {
  const status: RowStatus = rowDiff?.status ?? "unchanged";
  const badge = STATUS_BADGE[status];
  const nullCols = new Set(rowDiff?.nullColumns ?? []);

  // Only stagger rows that are actually animated (removed / added / null-introduced)
  const staggered = status !== "unchanged" && status !== "reordered";
  const rowStyle: CSSProperties | undefined = staggered
    ? { "--pb-row-delay": `${rowIndex * ROW_STAGGER_MS}ms` } as CSSProperties
    : undefined;

  return (
    <tr
      ref={rowRef}
      data-status={status}
      style={rowStyle}
      className={cn(
        "border-b border-slate-800/50 transition-colors",
        ROW_BG[status]
      )}
    >
      {columns.map((col) => {
        const isHidden = hiddenColumns.has(col);
        const value = row[col];
        const isNullIntroduced = nullCols.has(col);

        return (
          <td
            key={col}
            data-null-introduced={isNullIntroduced ? "true" : undefined}
            className={cn(
              "px-3 py-2 font-mono text-xs whitespace-nowrap",
              isHidden ? "opacity-20 text-slate-600" : "text-slate-300",
              isNullIntroduced && "rounded text-amber-300"
            )}
          >
            {isHidden ? (
              <span className="italic text-slate-700">—</span>
            ) : value === null || value === undefined ? (
              <span
                className={cn(
                  "italic",
                  isNullIntroduced ? "font-semibold text-amber-400" : "text-orange-400/80"
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

      {showReason && (
        <td className="px-3 py-2 whitespace-nowrap">
          {badge && (
            <span
              className={cn(
                "pb-badge inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                badge.cls
              )}
              title={rowDiff?.reason}
            >
              {badge.label}
            </span>
          )}
          {rowDiff?.reason && status !== "unchanged" && (
            <span className="pb-badge ml-2 text-[10px] italic text-slate-500">
              {rowDiff.reason}
            </span>
          )}
        </td>
      )}
    </tr>
  );
});

export default PlaybackRow;
