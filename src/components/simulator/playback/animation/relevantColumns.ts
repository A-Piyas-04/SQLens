import type { SimulatorStageType, TrackedRow } from "../../../../lib/simulator";
import {
  groupByColumns,
  havingColumns,
  orderByColumns,
  parseAggregates,
  whereColumns,
} from "./stageSqlParts";

/** Columns at or below this count are shown in full. */
export const MAX_FOCUS_COLUMNS = 6;
const MIN_PADDED_COLUMNS = 4;

export function columnsOf(rows: TrackedRow[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).filter((k) => k !== "_rowId");
}

/** A human-readable identifying column (name/title/label, else first text column). */
export function identityColumn(rows: TrackedRow[], columns: string[], exclude: string[] = []): string | null {
  const candidates = columns.filter((c) => !exclude.includes(c));
  const named = candidates.find((c) => /(^|_)(full_?name|name|title|label)$/i.test(c));
  if (named) return named;
  const sample = rows[0];
  const textual = candidates.find((c) => {
    const v = sample?.[c];
    return typeof v === "string" && v.trim() !== "" && Number.isNaN(Number(v));
  });
  return textual ?? null;
}

export type RelevantColumns = {
  /** Columns shown during focus/action, in source order. */
  focus: string[];
  /** Columns emphasised (predicate, sort keys, group keys, aggregates). */
  emphasis: string[];
  /** Number of source columns suppressed while the operation runs. */
  hiddenCount: number;
};

type Input = {
  stageType: SimulatorStageType;
  stageSql: string;
  prevRows: TrackedRow[];
  targetRows: TrackedRow[];
  joinKeys?: { left: string | null; right: string | null };
};

function pad(source: string[], required: string[], limit: number): string[] {
  const chosen = new Set(required);
  for (const c of source) {
    if (chosen.size >= limit) break;
    chosen.add(c);
  }
  return source.filter((c) => chosen.has(c));
}

function pick(source: string[], required: string[], identity: string | null): string[] {
  if (source.length <= MAX_FOCUS_COLUMNS) return source;
  const req = [...new Set([...(identity ? [identity] : []), ...required])].filter((c) => source.includes(c));
  const limit = Math.max(req.length, MIN_PADDED_COLUMNS);
  return pad(source, req, Math.min(limit, Math.max(req.length, MAX_FOCUS_COLUMNS)));
}

/**
 * Chooses the columns that matter for a stage's operation. ≤ 6 columns are
 * shown as-is; wider sources keep only operation-relevant columns plus an
 * identifying column.
 */
export function selectRelevantColumns({ stageType, stageSql, prevRows, targetRows, joinKeys }: Input): RelevantColumns {
  const prevCols = columnsOf(prevRows);
  const targetCols = columnsOf(targetRows);
  const source = prevCols.length > 0 ? prevCols : targetCols;
  const identity = identityColumn(prevRows.length > 0 ? prevRows : targetRows, source);

  let emphasis: string[] = [];
  let focus: string[] = source;

  switch (stageType) {
    case "FROM":
      focus = targetCols;
      break;
    case "WHERE":
      emphasis = whereColumns(stageSql, source);
      focus = pick(source, emphasis, identity);
      break;
    case "ORDER_BY":
      emphasis = orderByColumns(stageSql, source);
      focus = pick(source, emphasis, identity);
      break;
    case "LIMIT":
      emphasis = orderByColumns(stageSql, source);
      focus = pick(source, emphasis, identity);
      break;
    case "HAVING":
      emphasis = havingColumns(stageSql, source);
      focus = pick(source, emphasis, identity);
      break;
    case "GROUP_BY": {
      const keys = groupByColumns(stageSql, source);
      const aggInputs = parseAggregates(stageSql, source, targetCols)
        .map((a) => a.inputColumn)
        .filter((c): c is string => !!c && c !== "*");
      emphasis = [...new Set([...keys, ...aggInputs])];
      const ident = identity && !emphasis.includes(identity) ? identity : null;
      const required = [...(ident ? [ident] : []), ...emphasis];
      focus = required.length > 0 ? source.filter((c) => required.includes(c)) : pick(source, [], identity);
      break;
    }
    case "SELECT": {
      const kept = source.filter((c) => targetCols.includes(c));
      const dropped = source.filter((c) => !targetCols.includes(c));
      emphasis = kept;
      const room = Math.max(MAX_FOCUS_COLUMNS - kept.length, 2);
      const shownDropped = dropped.slice(0, room);
      focus = source.filter((c) => kept.includes(c) || shownDropped.includes(c));
      break;
    }
    case "JOIN": {
      emphasis = [joinKeys?.left, joinKeys?.right].filter((c): c is string => !!c);
      focus = pick(targetCols, emphasis, identityColumn(targetRows, targetCols));
      return { focus, emphasis, hiddenCount: Math.max(0, targetCols.length - focus.length) };
    }
  }

  return { focus, emphasis, hiddenCount: Math.max(0, source.length - focus.length) };
}
