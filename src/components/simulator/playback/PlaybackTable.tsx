import { type CSSProperties, memo } from "react";
import { cn } from "../../../lib/utils/cn";
import { useFlipAnimation } from "../../../hooks/useFlipAnimation";
import PlaybackRow from "./PlaybackRow";
import { ANIM_MS, type PlaybackSpeed } from "../../../hooks/useSimulatorPlayback";
import type {
  TrackedRow,
  StageDiff,
  RowDiff,
} from "../../../lib/simulator";
import type { SimulatorStageType } from "../../../lib/simulator";

const HEAD_COUNT  = 15;
const TAIL_COUNT  = 5;
const ROW_THRESHOLD = 40;

type VirtualRow = TrackedRow | "ellipsis";

function virtualizeRows(rows: TrackedRow[]): VirtualRow[] {
  if (rows.length <= ROW_THRESHOLD) return rows;
  return [
    ...rows.slice(0, HEAD_COUNT),
    "ellipsis",
    ...rows.slice(-TAIL_COUNT),
  ] as VirtualRow[];
}

function hiddenCount(rows: TrackedRow[]): number {
  return Math.max(0, rows.length - HEAD_COUNT - TAIL_COUNT);
}

type Props = {
  rows: TrackedRow[];
  diff: StageDiff | null;
  animationKey: number;
  speed: PlaybackSpeed;
  stageType: SimulatorStageType;
  /** Extra rows from prev snapshot (removed rows shown inline at filtering stages) */
  removedRows?: TrackedRow[];
};

const PlaybackTable = memo(function PlaybackTable({
  rows,
  diff,
  animationKey,
  speed,
  stageType,
  removedRows = [],
}: Props) {
  const useFlip = stageType === "ORDER_BY";
  const { registerRow } = useFlipAnimation(useFlip ? animationKey : -1);

  const diffByRowId = new Map<string, RowDiff>(
    (diff?.rowDiffs ?? []).map((d) => [d.rowId, d])
  );

  // Columns from visible rows (prefer current rows for column list)
  const allRows = [...rows, ...removedRows];
  const visibleCols =
    allRows.length > 0
      ? Object.keys(allRows[0]).filter((k) => k !== "_rowId")
      : [];

  const hiddenCols = new Set(
    (diff?.columnDiffs ?? [])
      .filter((c) => c.status === "hidden")
      .map((c) => c.column)
  );

  const hasDiff =
    diff !== null &&
    diff.rowDiffs.some((d) => d.status !== "unchanged");

  const showReason = hasDiff;

  // Combine actual rows + removed rows for display at filtering stages
  const displayRows: TrackedRow[] = [
    ...rows,
    ...removedRows,
  ];

  const virtualRows = virtualizeRows(displayRows);

  if (virtualRows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No rows at this stage.
      </p>
    );
  }

  const animStyle: CSSProperties = {
    "--pb-anim-ms": `${ANIM_MS[speed]}ms`,
  } as CSSProperties;

  return (
    <div className="max-h-[calc(100vh-320px)] overflow-auto rounded-lg border border-slate-700/50">
      <table className="pb-table w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
          <tr>
            {visibleCols.map((col) => (
              <th
                key={col}
                className={cn(
                  "border-b border-slate-700/80 px-3 py-2.5 text-left font-semibold whitespace-nowrap",
                  hiddenCols.has(col)
                    ? "text-slate-600 line-through opacity-50"
                    : "text-slate-300"
                )}
              >
                {col}
                {hiddenCols.has(col) && (
                  <span className="ml-1 text-[9px] font-normal opacity-60">
                    hidden
                  </span>
                )}
              </th>
            ))}
            {showReason && (
              <th className="border-b border-slate-700/80 px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">
                change
              </th>
            )}
          </tr>
        </thead>

        <tbody key={animationKey} style={animStyle}>
          {virtualRows.map((vrow) => {
            if (vrow === "ellipsis") {
              return (
                <tr key="ellipsis" className="border-b border-slate-800/30">
                  <td
                    colSpan={visibleCols.length + (showReason ? 1 : 0)}
                    className="px-3 py-2 text-center text-xs text-slate-600 italic tracking-wider"
                  >
                    ┄ ┄ ┄ &nbsp;{hiddenCount(displayRows)} rows not shown&nbsp; ┄ ┄ ┄
                  </td>
                </tr>
              );
            }

            return (
              <PlaybackRow
                key={vrow._rowId}
                row={vrow}
                columns={visibleCols}
                hiddenColumns={hiddenCols}
                rowDiff={diffByRowId.get(vrow._rowId)}
                rowIndex={virtualRows.indexOf(vrow)}
                rowRef={useFlip ? (el) => registerRow(vrow._rowId, el) : undefined}
                showReason={showReason}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default PlaybackTable;
