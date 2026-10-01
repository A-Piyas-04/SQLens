import type { TrackedRow } from "../../../../lib/simulator";
import { groupByColumns, parseAggregates, type AggregateSpec } from "./stageSqlParts";
import { columnsOf } from "./relevantColumns";

export type AggregateDisplay = {
  label: string;
  /** e.g. "(145,000 + 132,000) ÷ 2" or "2 rows". */
  expression: string;
  /** Formatted value from the actual stage snapshot, when mappable. */
  result: string | null;
};

export type GroupInfo = {
  key: string;
  index: number;
  label: string;
  memberIds: string[];
  /** `_rowId` of the matching row in the grouped snapshot, if identifiable. */
  targetRowId: string | null;
  aggregates: AggregateDisplay[];
};

export type GroupModel = {
  keyColumns: string[];
  aggregates: AggregateSpec[];
  groups: GroupInfo[];
  groupIndexByRowId: Map<string, number>;
};

const MAX_TERMS = 4;

export function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return formatNumber(v);
  const s = String(v);
  if (s.trim() !== "" && /^-?\d+(\.\d+)?$/.test(s.trim())) return formatNumber(Number(s));
  return s;
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function keyOf(row: TrackedRow, cols: string[]): string {
  return cols.map((c) => (row[c] === null || row[c] === undefined ? "∅" : String(row[c]))).join("|");
}

/** Fallback when GROUP BY columns cannot be parsed: shared column with the most buckets. */
function heuristicKeyColumns(prevRows: TrackedRow[], targetRows: TrackedRow[]): string[] {
  const prevCols = new Set(columnsOf(prevRows));
  const candidates = columnsOf(targetRows).filter((c) => prevCols.has(c));
  if (candidates.length === 0) return [];
  let best = candidates[0];
  let bestBuckets = -1;
  for (const col of candidates) {
    const n = new Set(prevRows.map((r) => String(r[col]))).size;
    if (n > bestBuckets && n <= targetRows.length) {
      bestBuckets = n;
      best = col;
    }
  }
  return [best];
}

function describeAggregate(spec: AggregateSpec, members: TrackedRow[], result: string | null): AggregateDisplay {
  const values =
    spec.inputColumn && spec.inputColumn !== "*"
      ? members.map((m) => m[spec.inputColumn as string]).filter((v) => v !== null && v !== undefined)
      : [];
  const terms = values.slice(0, MAX_TERMS).map(formatValue);
  const more = values.length > MAX_TERMS ? ` + … (${values.length})` : "";
  let expression: string;
  switch (spec.fn) {
    case "COUNT":
      expression = `${members.length} row${members.length === 1 ? "" : "s"}`;
      break;
    case "SUM":
      expression = terms.length > 0 ? `${terms.join(" + ")}${more}` : spec.label;
      break;
    case "AVG":
      expression =
        terms.length > 0 ? `(${terms.join(" + ")}${more}) ÷ ${values.length}` : spec.label;
      break;
    case "MIN":
    case "MAX":
      expression = terms.length > 0 ? `${spec.fn.toLowerCase()}(${terms.join(", ")}${more ? ", …" : ""})` : spec.label;
      break;
  }
  return { label: spec.label, expression, result };
}

/**
 * Partitions the pre-group rows by GROUP BY key and maps each partition to its
 * row in the grouped snapshot (aggregate values always come from the snapshot).
 */
export function buildGroupModel(prevRows: TrackedRow[], targetRows: TrackedRow[], stageSql: string): GroupModel {
  const prevCols = columnsOf(prevRows);
  const targetCols = columnsOf(targetRows);
  let keyColumns = groupByColumns(stageSql, prevCols);
  if (keyColumns.length === 0) keyColumns = heuristicKeyColumns(prevRows, targetRows);
  const aggregates = parseAggregates(stageSql, prevCols, targetCols);

  const byKey = new Map<string, TrackedRow[]>();
  for (const row of prevRows) {
    const k = keyOf(row, keyColumns);
    const list = byKey.get(k);
    if (list) list.push(row);
    else byKey.set(k, [row]);
  }

  const targetKeyCols = keyColumns.filter((c) => targetCols.includes(c));
  const canMap = targetKeyCols.length === keyColumns.length && keyColumns.length > 0;
  const targetByKey = new Map<string, TrackedRow>();
  if (canMap) {
    for (const t of targetRows) targetByKey.set(keyOf(t, keyColumns), t);
  }

  const groups: GroupInfo[] = [];
  const groupIndexByRowId = new Map<string, number>();
  let index = 0;
  for (const [key, members] of byKey) {
    const target = canMap ? targetByKey.get(key) ?? null : null;
    const label = keyColumns.length > 0
      ? keyColumns.map((c) => formatValue(members[0][c])).join(" · ")
      : "All rows";
    const aggs = aggregates.map((spec) =>
      describeAggregate(
        spec,
        members,
        target && spec.outputColumn ? formatValue(target[spec.outputColumn]) : null
      )
    );
    groups.push({
      key,
      index,
      label,
      memberIds: members.map((m) => m._rowId),
      targetRowId: target?._rowId ?? null,
      aggregates: aggs,
    });
    for (const m of members) groupIndexByRowId.set(m._rowId, index);
    if (target) groupIndexByRowId.set(target._rowId, index);
    index += 1;
  }

  return { keyColumns, aggregates, groups, groupIndexByRowId };
}
