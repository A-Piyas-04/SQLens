import { type CSSProperties, memo, useMemo, useRef } from "react";
import { cn } from "../../../lib/utils/cn";
import { useFlipAnimation } from "../../../hooks/useFlipAnimation";
import PlaybackRow from "./PlaybackRow";
import { ANIM_MS, type PlaybackSpeed, type TransitionPhase } from "../../../hooks/useSimulatorPlayback";
import type { TrackedRow, StageDiff, RowDiff } from "../../../lib/simulator";
import type { SimulatorStageType } from "../../../lib/simulator";

const HEAD_COUNT = 15;
const TAIL_COUNT = 5;
const ROW_THRESHOLD = 40;
const EJECT_STAGGER_MS = 35;

type VirtualRow = TrackedRow | "ellipsis";

function virtualizeRows(rows: TrackedRow[]): VirtualRow[] {
  if (rows.length <= ROW_THRESHOLD) return rows;
  return [...rows.slice(0, HEAD_COUNT), "ellipsis", ...rows.slice(-TAIL_COUNT)] as VirtualRow[];
}

function hiddenCount(rows: TrackedRow[]): number {
  return Math.max(0, rows.length - HEAD_COUNT - TAIL_COUNT);
}

function parseOrderByColumns(sql: string): string[] {
  const m = sql.match(/\bORDER\s+BY\b([\s\S]*?)(?=\bLIMIT\b|;|$)/i);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((part) => part.trim().replace(/\s+(ASC|DESC)\b/gi, "").split(/\s+/).pop() ?? "")
    .filter((c) => c.length > 0 && !/^\d+$/.test(c));
}

function deriveGroupKeyColumns(prevRows: TrackedRow[], targetRows: TrackedRow[]): string[] {
  if (prevRows.length === 0 || targetRows.length === 0) return [];
  const targetCols = Object.keys(targetRows[0]).filter((k) => k !== "_rowId");
  const prevCols = new Set(Object.keys(prevRows[0]).filter((k) => k !== "_rowId"));
  const candidates = targetCols.filter((c) => prevCols.has(c));
  if (candidates.length === 0) return targetCols.slice(0, 1);

  let best = candidates[0];
  let bestBuckets = 0;
  for (const col of candidates) {
    const keys = new Set(prevRows.map((r) => String(r[col])));
    if (keys.size >= bestBuckets && keys.size <= prevRows.length) {
      bestBuckets = keys.size;
      best = col;
    }
  }
  return [best];
}

function buildGroupMap(
  rows: TrackedRow[],
  keyCols: string[]
): Map<string, { index: number; leaderId: string; members: string[] }> {
  const map = new Map<string, { index: number; leaderId: string; members: string[] }>();
  let groupCounter = 0;
  for (const row of rows) {
    const key = keyCols.map((c) => String(row[c])).join("|");
    const existing = map.get(key);
    if (existing) {
      existing.members.push(row._rowId);
    } else {
      map.set(key, { index: groupCounter++, leaderId: row._rowId, members: [row._rowId] });
    }
  }
  return map;
}

function computeEjectDelays(removedCount: number, act2Ms: number): number[] {
  if (removedCount === 0) return [];
  const maxStagger = act2Ms * 0.4;
  const staggerMs = Math.min(EJECT_STAGGER_MS, maxStagger / removedCount);
  return Array.from({ length: removedCount }, (_, i) => i * staggerMs);
}

type Props = {
  rows: TrackedRow[];
  targetRows: TrackedRow[];
  prevRows: TrackedRow[];
  diff: StageDiff | null;
  animationKey: number;
  speed: PlaybackSpeed;
  stageType: SimulatorStageType;
  transitionPhase: TransitionPhase;
  showRowIds: boolean;
  prevRowCount: number;
  targetRowCount: number;
  limitValue?: string;
  stageSql: string;
};

const PlaybackTable = memo(function PlaybackTable({
  rows,
  targetRows,
  prevRows,
  diff,
  animationKey,
  speed,
  stageType,
  transitionPhase,
  showRowIds,
  prevRowCount,
  targetRowCount,
  limitValue,
  stageSql,
}: Props) {
  const prevRowsRef = useRef(prevRows);
  if (transitionPhase === "idle" || transitionPhase === "settled") {
    prevRowsRef.current = targetRows;
  }

  const isFilterStage =
    stageType === "WHERE" || stageType === "HAVING" || stageType === "LIMIT";
  const act2Ms = Math.round(ANIM_MS[speed] * 0.8);

  const removedIds = useMemo(
    () =>
      new Set(
        (diff?.rowDiffs ?? []).filter((d) => d.status === "removed").map((d) => d.rowId)
      ),
    [diff]
  );

  const removedIdList = useMemo(
    () => (diff?.rowDiffs ?? []).filter((d) => d.status === "removed").map((d) => d.rowId),
    [diff]
  );

  const ejectDelays = useMemo(
    () => computeEjectDelays(removedIdList.length, act2Ms),
    [removedIdList.length, act2Ms]
  );

  const ejectIndexByRowId = useMemo(() => {
    const m = new Map<string, number>();
    removedIdList.forEach((id: string, i: number) => m.set(id, i));
    return m;
  }, [removedIdList]);

  const orderByColumns = useMemo(
    () => new Set(parseOrderByColumns(stageSql)),
    [stageSql]
  );

  const groupKeyCols = useMemo(
    () =>
      stageType === "GROUP_BY" ? deriveGroupKeyColumns(prevRows, targetRows) : [],
    [stageType, prevRows, targetRows]
  );

  const groupMap = useMemo(
    () => (stageType === "GROUP_BY" ? buildGroupMap(prevRows, groupKeyCols) : new Map()),
    [stageType, prevRows, groupKeyCols]
  );

  const rowIdToGroup = useMemo(() => {
    const m = new Map<string, { index: number; isLeader: boolean }>();
    for (const g of groupMap.values()) {
      g.members.forEach((id: string, i: number) => {
        m.set(id, { index: g.index, isLeader: i === 0 });
      });
    }
    if (stageType === "GROUP_BY" && groupKeyCols.length > 0) {
      const keyToIndex = new Map<string, number>();
      for (const g of groupMap.values()) {
        const leader = prevRows.find((r) => r._rowId === g.leaderId);
        if (leader) {
          keyToIndex.set(groupKeyCols.map((c) => String(leader[c])).join("|"), g.index);
        }
      }
      for (const row of targetRows) {
        const key = groupKeyCols.map((c) => String(row[c])).join("|");
        const idx = keyToIndex.get(key);
        if (idx !== undefined) {
          m.set(row._rowId, { index: idx, isLeader: true });
        }
      }
    }
    return m;
  }, [groupMap, stageType, groupKeyCols, prevRows, targetRows]);

  const isOrderBy = stageType === "ORDER_BY";
  const flipKey =
    isOrderBy && transitionPhase === "transforming" ? animationKey : -1;
  const { registerRow } = useFlipAnimation(flipKey, { durationMs: ANIM_MS[speed] });

  const diffByRowId = new Map<string, RowDiff>(
    (diff?.rowDiffs ?? []).map((d) => [d.rowId, d])
  );

  const hiddenCols = new Set(
    (diff?.columnDiffs ?? []).filter((c) => c.status === "hidden").map((c) => c.column)
  );

  const allRowsForCols = [...rows, ...targetRows, ...prevRows];
  const visibleCols =
    allRowsForCols.length > 0
      ? [...new Set(allRowsForCols.flatMap((r) => Object.keys(r).filter((k) => k !== "_rowId")))]
      : [];

  const hasDiff =
    diff !== null && diff.rowDiffs.some((d) => d.status !== "unchanged");
  const showReason = hasDiff && (transitionPhase === "idle" || transitionPhase === "settled");

  const isVirtualized = rows.length > ROW_THRESHOLD;
  const visibleRowIdSet = useMemo(() => {
    if (!isVirtualized) return null;
    const v = virtualizeRows(rows).filter((r): r is TrackedRow => r !== "ellipsis");
    return new Set(v.map((r) => r._rowId));
  }, [rows, isVirtualized]);

  const survivingIds = useMemo(() => {
    const prevIds = new Set(prevRows.map((r) => r._rowId));
    return new Set(
      targetRows.filter((r) => prevIds.has(r._rowId) && !removedIds.has(r._rowId)).map((r) => r._rowId)
    );
  }, [prevRows, targetRows, removedIds]);

  const filterMainRows =
    stageType === "LIMIT" &&
    (transitionPhase === "departing" || transitionPhase === "transforming")
      ? rows.filter((r) => !removedIds.has(r._rowId))
      : rows;

  const filterLimitRows =
    stageType === "LIMIT" &&
    (transitionPhase === "departing" || transitionPhase === "transforming")
      ? rows.filter((r) => removedIds.has(r._rowId))
      : [];

  const virtualMain = virtualizeRows(filterMainRows);
  const virtualLimit = virtualizeRows(filterLimitRows);

  const fromStaggerMs = Math.min(40, 600 / Math.max(rows.length, 1));

  if (rows.length === 0 && transitionPhase !== "transforming") {
    return (
      <p className="py-8 text-center text-sm text-slate-500">No rows at this stage.</p>
    );
  }

  const showCountPulse =
    isFilterStage && transitionPhase === "arriving" && prevRowCount !== targetRowCount;

  const tableEntering = stageType === "FROM" && transitionPhase === "transforming";

  return (
    <div
      className={cn(
        "max-h-[calc(100vh-280px)] overflow-auto rounded-lg border border-slate-700/50",
        tableEntering && "pb-table-from-enter"
      )}
    >
      {isFilterStage && (
        <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-800/60 px-3 py-1.5 text-[10px] text-slate-500">
          <span>Rows</span>
          <span className="tabular-nums">
            <span className={showCountPulse ? "line-through text-slate-600" : ""}>
              {showCountPulse ? prevRowCount : targetRowCount}
            </span>
            {showCountPulse && (
              <>
                {" → "}
                <span className="pb-count-update font-semibold text-slate-200">
                  {targetRowCount}
                </span>
              </>
            )}
            {!showCountPulse && (
              <span className="font-semibold text-slate-300">{targetRowCount}</span>
            )}
          </span>
        </div>
      )}

      <table className="pb-table w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
          <tr>
            {showRowIds && (
              <th className="border-b border-slate-700/80 px-2 py-2.5 text-left font-semibold text-slate-500">
                id
              </th>
            )}
            {visibleCols.map((col, colIdx) => {
              const isDropped = hiddenCols.has(col);
              const colCollapsing =
                stageType === "SELECT" &&
                isDropped &&
                transitionPhase === "transforming";
              const colDeparting =
                stageType === "SELECT" && isDropped && transitionPhase === "departing";
              const colSurvived =
                stageType === "SELECT" &&
                !isDropped &&
                transitionPhase === "arriving";

              return (
                <th
                  key={col}
                  className={cn(
                    "border-b border-slate-700/80 px-3 py-2.5 text-left font-semibold whitespace-nowrap",
                    isDropped && transitionPhase === "idle" && "text-slate-600 line-through opacity-50",
                    !isDropped && "text-slate-300",
                    colDeparting && "pb-col-dropped-header",
                    colCollapsing && "pb-col-collapsing",
                    colSurvived && "pb-col-survived"
                  )}
                  style={
                    colCollapsing
                      ? ({ transitionDelay: `${colIdx * 100}ms` } as CSSProperties)
                      : undefined
                  }
                >
                  {col}
                </th>
              );
            })}
            {showReason && (
              <th className="border-b border-slate-700/80 px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">
                change
              </th>
            )}
          </tr>
        </thead>

        <tbody key={`${animationKey}-${transitionPhase}`}>
          {virtualMain.map((vrow, idx) => {
            if (vrow === "ellipsis") {
              return (
                <tr key="ellipsis" className="border-b border-slate-800/30">
                  <td
                    colSpan={visibleCols.length + (showReason ? 1 : 0) + (showRowIds ? 1 : 0)}
                    className="px-3 py-2 text-center text-xs text-slate-600 italic tracking-wider"
                  >
                    ┄ ┄ ┄ &nbsp;{hiddenCount(filterMainRows)} rows not shown&nbsp; ┄ ┄ ┄
                  </td>
                </tr>
              );
            }

            const rowDiff = diffByRowId.get(vrow._rowId);
            const isCondemned =
              isFilterStage &&
              removedIds.has(vrow._rowId) &&
              (transitionPhase === "departing" || transitionPhase === "transforming");
            const ejectIdx = ejectIndexByRowId.get(vrow._rowId) ?? 0;
            const animateEject =
              !isVirtualized || visibleRowIdSet?.has(vrow._rowId) === true;
            const groupInfo = rowIdToGroup.get(vrow._rowId);
            const flipRegister = isOrderBy
              ? (el: HTMLTableRowElement | null) => registerRow(vrow._rowId, el)
              : undefined;

            return (
              <PlaybackRow
                key={vrow._rowId}
                row={vrow}
                columns={visibleCols}
                hiddenColumns={hiddenCols}
                rowDiff={rowDiff}
                rowRef={flipRegister}
                showReason={showReason}
                showRowId={showRowIds}
                transitionPhase={transitionPhase}
                isCondemned={isCondemned}
                isSurviving={survivingIds.has(vrow._rowId)}
                ejectDelayMs={ejectDelays[ejectIdx] ?? 0}
                animateEject={animateEject}
                groupIndex={groupInfo?.index}
                isGroupLeader={groupInfo?.isLeader}
                isGroupFollower={groupInfo !== undefined && !groupInfo.isLeader}
                orderByColumns={orderByColumns}
                highlightOrderBy={
                  stageType === "ORDER_BY" && transitionPhase === "departing"
                }
                postOrderByHighlight={
                  stageType === "ORDER_BY" && transitionPhase === "arriving"
                }
                isFromEnter={stageType === "FROM" && transitionPhase === "transforming"}
                fromEnterDelayMs={idx * fromStaggerMs}
                stageType={stageType}
              />
            );
          })}
        </tbody>

        {filterLimitRows.length > 0 && (
          <tbody className="border-t border-dashed border-rose-500/40">
            <tr>
              <td
                colSpan={visibleCols.length + (showReason ? 1 : 0) + (showRowIds ? 1 : 0)}
                className="bg-slate-900/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-400/80"
              >
                LIMIT {limitValue ?? targetRowCount}
              </td>
            </tr>
            {virtualLimit.map((vrow) => {
              if (vrow === "ellipsis") return null;
              const rowDiff = diffByRowId.get(vrow._rowId);
              const ejectIdx = ejectIndexByRowId.get(vrow._rowId) ?? 0;
              const animateEject =
                !isVirtualized || visibleRowIdSet?.has(vrow._rowId) === true;

              return (
                <PlaybackRow
                  key={`limit-${vrow._rowId}`}
                  row={vrow}
                  columns={visibleCols}
                  hiddenColumns={hiddenCols}
                  rowDiff={rowDiff}
                  showReason={false}
                  showRowId={showRowIds}
                  transitionPhase={transitionPhase}
                  isCondemned={
                    transitionPhase === "departing" || transitionPhase === "transforming"
                  }
                  isSurviving={false}
                  ejectDelayMs={ejectDelays[ejectIdx] ?? 0}
                  animateEject={animateEject}
                  orderByColumns={orderByColumns}
                  highlightOrderBy={false}
                  postOrderByHighlight={false}
                  isFromEnter={false}
                  fromEnterDelayMs={0}
                  stageType={stageType}
                />
              );
            })}
          </tbody>
        )}
      </table>
    </div>
  );
});

export default PlaybackTable;
