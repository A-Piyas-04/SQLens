import type { SimulatorSnapshot, StageDiff, TrackedRow } from "../../../../lib/simulator";
import type {
  ColumnSpec,
  GridItem,
  GridViewState,
  JoinViewState,
  RowMark,
  StageModel,
  StageViewState,
} from "./stageAnimationTypes";
import { columnsOf, selectRelevantColumns } from "./relevantColumns";
import { extractStageExpression, limitValue } from "./stageSqlParts";
import { buildGroupModel } from "./groupModel";
import { buildJoinModel } from "./joinModel";
import { FOCUS_ROW_LIMIT, FULL_ROW_LIMIT, otherRowsLabel, windowRows } from "./rowWindow";

type BuildInput = {
  snapshot: SimulatorSnapshot;
  prevSnapshot: SimulatorSnapshot | null;
  diff: StageDiff | null;
  originalSql: string;
  focusOnChanges: boolean;
};

export function buildStageModel({ snapshot, prevSnapshot, diff, originalSql, focusOnChanges }: BuildInput): StageModel {
  const prevRows = prevSnapshot?.rows ?? [];
  const targetRows = snapshot.rows;
  const join = snapshot.stageType === "JOIN" ? buildJoinModel(snapshot, prevSnapshot) : null;
  const relevant = selectRelevantColumns({
    stageType: snapshot.stageType,
    stageSql: snapshot.sql,
    prevRows,
    targetRows,
    joinKeys: join ? { left: join.keys.leftKey, right: join.keys.rightKey } : undefined,
  });
  const removedIds = new Set(
    (diff?.rowDiffs ?? []).filter((d) => d.status === "removed").map((d) => d.rowId)
  );
  const expression = extractStageExpression(originalSql, snapshot.stageType, snapshot.joinIndex ?? 0);
  const limit = snapshot.stageType === "LIMIT" ? limitValue(snapshot.sql) : null;

  return {
    snapshot,
    prevSnapshot,
    diff,
    prevColumns: columnsOf(prevRows),
    targetColumns: columnsOf(targetRows),
    removedIds,
    focusColumns: relevant.focus,
    emphasisColumns: new Set(relevant.emphasis),
    conditionText: snapshot.stageType === "LIMIT" ? `LIMIT ${limit ?? snapshot.rowCount}` : expression || null,
    focusOnChanges,
    rowLimit: focusOnChanges ? FOCUS_ROW_LIMIT : FULL_ROW_LIMIT,
    group:
      snapshot.stageType === "GROUP_BY" && prevSnapshot
        ? buildGroupModel(prevRows, targetRows, snapshot.sql)
        : null,
    join,
  };
}

// ── Grid item helpers ───────────────────────────────────────────────────────

export function rowItems(
  rows: TrackedRow[],
  opts: {
    marks?: Map<string, RowMark>;
    groupIndex?: Map<string, number>;
    hints?: Map<string, "up" | "down">;
  } = {}
): GridItem[] {
  return rows.map((row) => ({
    kind: "row" as const,
    id: row._rowId,
    row,
    mark: opts.marks?.get(row._rowId),
    groupIndex: opts.groupIndex?.get(row._rowId),
    hint: opts.hints?.get(row._rowId),
  }));
}

export function withSummary(items: GridItem[], hiddenCount: number, noun = "row"): GridItem[] {
  if (hiddenCount <= 0) return items;
  return [...items, { kind: "summary", id: "summary", label: otherRowsLabel(hiddenCount, noun) }];
}

export function columnSpecs(keys: string[], marks?: (key: string) => ColumnSpec["mark"]): ColumnSpec[] {
  return keys.map((key) => ({ key, mark: marks?.(key) }));
}

export function hiddenColumnsLabel(n: number): string | null {
  return n > 0 ? `+${n} column${n === 1 ? "" : "s"} hidden during this step` : null;
}

/**
 * Keeps rows that were visible in the previous view (continuity), then fills
 * remaining slots in snapshot order.
 */
export function continueWindow(rows: TrackedRow[], visibleIds: Set<string>, limit: number) {
  if (rows.length <= limit) return { rows, hiddenCount: 0 };
  const keep = new Set<number>();
  rows.forEach((r, i) => {
    if (visibleIds.has(r._rowId) && keep.size < limit) keep.add(i);
  });
  for (let i = 0; i < rows.length && keep.size < limit; i++) keep.add(i);
  const shown = [...keep].sort((a, b) => a - b).map((i) => rows[i]);
  return { rows: shown, hiddenCount: rows.length - shown.length };
}

export function visibleRowIds(view: StageViewState | null): Set<string> {
  if (!view || view.kind !== "grid") return new Set();
  return new Set(view.items.filter((i) => i.kind === "row").map((i) => i.id));
}

function changedIds(model: StageModel): string[] {
  return (model.diff?.rowDiffs ?? [])
    .filter((d) => d.status !== "unchanged" && d.status !== "removed")
    .map((d) => d.rowId);
}

function unitFor(model: StageModel, side: "before" | "after"): string {
  const t = model.snapshot.stageType;
  if (t === "HAVING") return "group";
  if (t === "GROUP_BY" && side === "after") return "group";
  return "row";
}

export function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/** Concise, operation-specific result line. */
export function buildCaption(model: StageModel): string | null {
  const { snapshot, prevSnapshot, removedIds, conditionText } = model;
  const before = prevSnapshot?.rowCount ?? snapshot.rowCount;
  const after = snapshot.rowCount;
  switch (snapshot.stageType) {
    case "FROM":
      return `${plural(after, "row")} loaded`;
    case "WHERE":
      return removedIds.size > 0
        ? `${plural(removedIds.size, "row")} removed by ${conditionText ?? "WHERE"}`
        : `Every row passed ${conditionText ?? "the condition"}`;
    case "HAVING":
      return removedIds.size > 0
        ? `${plural(removedIds.size, "group")} removed by ${conditionText ?? "HAVING"}`
        : `Every group passed ${conditionText ?? "the condition"}`;
    case "LIMIT":
      return removedIds.size > 0
        ? `${plural(removedIds.size, "row")} beyond ${conditionText ?? "the limit"} removed`
        : `All rows fit within ${conditionText ?? "the limit"}`;
    case "SELECT": {
      const dropped = model.prevColumns.filter((c) => !model.targetColumns.includes(c));
      const added = model.targetColumns.filter((c) => !model.prevColumns.includes(c));
      const parts: string[] = [];
      if (dropped.length > 0) parts.push(`${plural(dropped.length, "column")} dropped`);
      if (added.length > 0) parts.push(`${plural(added.length, "column")} computed`);
      parts.push(`${plural(model.targetColumns.length, "column")} in output`);
      return parts.join(" · ");
    }
    case "ORDER_BY": {
      const moved = (model.diff?.rowDiffs ?? []).filter((d) => d.status === "reordered").length;
      return moved > 0 ? `${plural(moved, "row")} moved by ${conditionText ?? "ORDER BY"}` : "Rows were already in order";
    }
    case "GROUP_BY":
      return `${plural(before, "row")} → ${plural(after, "group")}`;
    case "JOIN":
      return `${plural(after, "row")} in the joined result`;
  }
}

export function countLabels(model: StageModel): { before: string; after: string } {
  const before = model.prevSnapshot?.rowCount ?? model.snapshot.rowCount;
  return {
    before: plural(before, unitFor(model, "before")),
    after: plural(model.snapshot.rowCount, unitFor(model, "after")),
  };
}

/** The exact settled state of a stage — always derived from the snapshot. */
export function settledView(model: StageModel, continuity?: Set<string>): StageViewState {
  if (model.join) return settledJoinView(model);
  const rows = model.snapshot.rows;
  const win =
    continuity && continuity.size > 0
      ? continueWindow(rows, continuity, model.rowLimit)
      : windowRows(rows, changedIds(model), model.rowLimit);
  const view: GridViewState = {
    kind: "grid",
    phase: "settled",
    items: withSummary(rowItems(win.rows), win.hiddenCount, unitFor(model, "after")),
    columns: columnSpecs(model.targetColumns),
    hiddenColumnsLabel: null,
    caption: buildCaption(model),
    countPhase: "after",
  };
  return view;
}

export function settledJoinView(model: StageModel): JoinViewState {
  const join = model.join!;
  const arrows = join.animatedSteps.flatMap((step) =>
    step.pairs.map((pair, pi) => ({
      key: "null" in pair ? `${step.leftId}->null-${pi}` : `${step.leftId}->${pair.rightId}`,
      leftId: step.leftId,
      rightId: "rightId" in pair ? pair.rightId : null,
      isNull: "null" in pair,
      status: "done" as const,
    }))
  );
  return {
    kind: "join",
    phase: "settled",
    joinPhase: "result",
    stepIndex: -1,
    pairIndex: 0,
    arrows,
    completedSteps: join.animatedSteps.length,
    laneMessage: null,
    showSkippedSummary: join.skippedStepCount > 0,
    countPhase: "after",
  };
}
