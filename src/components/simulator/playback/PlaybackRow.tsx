import { type CSSProperties, memo } from "react";
import { XCircle } from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import type { RowDiff, RowStatus, TrackedRow } from "../../../lib/simulator";
import type { TransitionPhase } from "../../../hooks/useSimulatorPlayback";

const ROW_HEIGHT_PX = 36;

const GROUP_BORDER: Record<number, string> = {
  0: "border-l-emerald-700",
  1: "border-l-orange-700",
  2: "border-l-teal-700",
  3: "border-l-amber-700",
  4: "border-l-rose-700",
  5: "border-l-stone-600",
};

const GROUP_BG: Record<number, string> = {
  0: "bg-emerald-100",
  1: "bg-orange-100",
  2: "bg-teal-100",
  3: "bg-amber-100",
  4: "bg-rose-100",
  5: "bg-stone-100",
};

type Props = {
  row: TrackedRow;
  columns: string[];
  hiddenColumns: Set<string>;
  rowDiff: RowDiff | undefined;
  rowRef?: (el: HTMLTableRowElement | null) => void;
  showReason: boolean;
  showRowId: boolean;
  transitionPhase: TransitionPhase;
  isCondemned: boolean;
  isSurviving: boolean;
  ejectDelayMs: number;
  animateEject: boolean;
  groupIndex?: number;
  isGroupLeader?: boolean;
  isGroupFollower?: boolean;
  orderByColumns: Set<string>;
  highlightOrderBy: boolean;
  postOrderByHighlight: boolean;
  isFromEnter: boolean;
  fromEnterDelayMs: number;
  stageType: string;
};

const ROW_BG: Record<RowStatus, string> = {
  unchanged: "",
  removed: "data-[status=removed]:opacity-25 data-[status=removed]:bg-red-500/8",
  added: "data-[status=added]:bg-emerald-500/8",
  reordered: "data-[status=reordered]:border-l-2 data-[status=reordered]:border-l-teal-700",
  "null-introduced": "data-[status=null-introduced]:bg-amber-500/5",
};

const STATUS_BADGE: Partial<Record<RowStatus, { label: string; cls: string }>> = {
  removed: { label: "filtered", cls: "border-red-500/30 bg-red-500/10 text-red-400" },
  added: { label: "matched", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  reordered: { label: "reordered", cls: "border-teal-300 bg-teal-100 text-teal-800" },
  "null-introduced": { label: "null row", cls: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
};

const PlaybackRow = memo(function PlaybackRow({
  row,
  columns,
  hiddenColumns,
  rowDiff,
  rowRef,
  showReason,
  showRowId,
  transitionPhase,
  isCondemned,
  isSurviving,
  ejectDelayMs,
  animateEject,
  groupIndex,
  isGroupLeader,
  isGroupFollower,
  orderByColumns,
  highlightOrderBy,
  postOrderByHighlight,
  isFromEnter,
  fromEnterDelayMs,
  stageType,
}: Props) {
  const status: RowStatus =
    transitionPhase === "settled" || transitionPhase === "idle"
      ? (rowDiff?.status ?? "unchanged")
      : "unchanged";
  const badge = STATUS_BADGE[status];
  const nullCols = new Set(rowDiff?.nullColumns ?? []);
  const isReordered = rowDiff?.status === "reordered";

  const rowStyle: CSSProperties = {
    ...(animateEject && isCondemned && transitionPhase === "transforming"
      ? {
          animationDelay: `${ejectDelayMs}ms`,
          maxHeight: `${ROW_HEIGHT_PX}px`,
        }
      : {}),
    ...(isFromEnter ? { animationDelay: `${fromEnterDelayMs}ms` } : {}),
    ...(groupIndex !== undefined && isGroupFollower && transitionPhase === "transforming"
      ? { transitionDelay: `${(groupIndex ?? 0) * 150}ms` }
      : {}),
  };

  return (
    <tr
      ref={rowRef}
      data-status={transitionPhase === "settled" || transitionPhase === "idle" ? status : "unchanged"}
      style={rowStyle}
      className={cn(
        "relative border-b border-line/50 transition-colors",
        ROW_BG[status],
        isCondemned && transitionPhase === "departing" && "pb-row-condemned",
        isCondemned && transitionPhase === "transforming" && animateEject && "pb-row-eject pb-row-collapsing",
        isCondemned && transitionPhase === "transforming" && !animateEject && "pb-row-collapsing opacity-0",
        isSurviving && transitionPhase === "arriving" && "pb-row-survived",
        isReordered && transitionPhase === "transforming" && stageType === "ORDER_BY" && "pb-row-sliding",
        groupIndex !== undefined && transitionPhase === "departing" && cn("border-l-2", GROUP_BORDER[groupIndex % 6], GROUP_BG[groupIndex % 6]),
        isGroupLeader && transitionPhase === "transforming" && groupIndex !== undefined && GROUP_BG[groupIndex % 6],
        isGroupFollower && transitionPhase === "transforming" && "pb-row-group-collapse opacity-0",
        groupIndex !== undefined &&
          (transitionPhase === "arriving" || transitionPhase === "settled") &&
          cn("border-l-2 pb-row-group-arrive", GROUP_BORDER[groupIndex % 6]),
        isFromEnter && transitionPhase === "transforming" && "pb-row-enter-cascade"
      )}
    >
      {showRowId && (
        <td
          className="w-6 border-r border-line/40 px-1 py-2 text-center font-mono text-[9px] text-ink-muted"
          style={{
            borderLeftColor: `hsl(${(Number(row._rowId.replace(/\D/g, "")) % 8) * 45} 70% 50% / 0.45)`,
          }}
        >
          #{row._rowId.replace("row-", "r").slice(0, 3)}
        </td>
      )}
      {columns.map((col, colIdx) => {
        const isHidden = hiddenColumns.has(col);
        const value = row[col];
        const isNullIntroduced = nullCols.has(col);
        const isOrderCol = orderByColumns.has(col);
        const isLastCol = colIdx === columns.length - 1;
        const showCondemnedIcon =
          isCondemned && transitionPhase === "departing" && isLastCol && !showReason;

        return (
          <td
            key={col}
            data-null-introduced={isNullIntroduced ? "true" : undefined}
            className={cn(
              "px-3 py-2 font-mono text-xs whitespace-nowrap",
              showCondemnedIcon && "relative",
              isHidden && transitionPhase !== "departing" && transitionPhase !== "transforming"
                ? "opacity-20 text-ink-muted"
                : "text-ink-secondary",
              isHidden &&
                (transitionPhase === "departing" || transitionPhase === "transforming") &&
                "pb-col-dropped-data opacity-25",
              isNullIntroduced && "rounded text-amber-300",
              highlightOrderBy && isOrderCol && "pb-order-col-highlight",
              postOrderByHighlight && isOrderCol && "pb-order-col-post"
            )}
          >
            {isHidden &&
            (transitionPhase === "departing" || transitionPhase === "transforming") ? (
              value === null || value === undefined ? (
                <span className="italic text-orange-400/80">NULL</span>
              ) : (
                String(value)
              )
            ) : isHidden ? (
              <span className="italic text-ink-muted">—</span>
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
            {showCondemnedIcon && (
              <XCircle
                className="pb-row-condemned-icon absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-red-400"
                aria-hidden
              />
            )}
          </td>
        );
      })}

      {showReason && (
        <td className="relative px-3 py-2 whitespace-nowrap">
          {isCondemned && transitionPhase === "departing" && (
            <XCircle
              className="pb-row-condemned-icon absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-red-400"
              aria-hidden
            />
          )}
          {(transitionPhase === "settled" || transitionPhase === "idle") && badge && (
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
          {rowDiff?.reason &&
            status !== "unchanged" &&
            (transitionPhase === "settled" || transitionPhase === "idle") && (
              <span className="pb-badge ml-2 text-[10px] italic text-ink-muted">
                {rowDiff.reason}
              </span>
            )}
        </td>
      )}

    </tr>
  );
});

export default PlaybackRow;
