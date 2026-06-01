import {
  ArrowUpDown,
  ChartBarStacked,
  Filter,
  Funnel,
  GitMerge,
  Hash,
  Layers,
  Table2,
  type LucideIcon,
} from "lucide-react";

import type {
  RowDiff,
  SimulatorSnapshot,
  SimulatorStageType,
  StageDiff,
  TrackedRow,
} from "../../lib/simulator";

export const STAGE_ICONS: Record<SimulatorStageType, LucideIcon> = {
  FROM: Table2,
  JOIN: GitMerge,
  WHERE: Filter,
  GROUP_BY: ChartBarStacked,
  HAVING: Funnel,
  SELECT: Layers,
  ORDER_BY: ArrowUpDown,
  LIMIT: Hash,
};

export const STAGE_COLORS: Record<
  SimulatorStageType,
  {
    pill: string;
    icon: string;
    border: string;
    header: string;
    dot: string;
    activeRow: string;
  }
> = {
  FROM: {
    pill: "bg-stone-100 text-stone-800 border-stone-300",
    icon: "text-stone-700",
    border: "border-stone-300",
    header: "bg-stone-50",
    dot: "bg-stone-600",
    activeRow: "bg-stone-100 border-l-2 border-l-stone-600 text-stone-900",
  },
  JOIN: {
    pill: "bg-orange-100 text-orange-900 border-orange-300",
    icon: "text-orange-800",
    border: "border-orange-300",
    header: "bg-orange-50",
    dot: "bg-orange-700",
    activeRow: "bg-orange-100 border-l-2 border-l-orange-700 text-orange-950",
  },
  WHERE: {
    pill: "bg-amber-100 text-amber-900 border-amber-300",
    icon: "text-amber-800",
    border: "border-amber-300",
    header: "bg-amber-50",
    dot: "bg-amber-700",
    activeRow: "bg-amber-100 border-l-2 border-l-amber-700 text-amber-950",
  },
  GROUP_BY: {
    pill: "bg-rose-100 text-rose-900 border-rose-300",
    icon: "text-rose-800",
    border: "border-rose-300",
    header: "bg-rose-50",
    dot: "bg-rose-700",
    activeRow: "bg-rose-100 border-l-2 border-l-rose-700 text-rose-950",
  },
  HAVING: {
    pill: "bg-orange-50 text-orange-950 border-orange-200",
    icon: "text-orange-900",
    border: "border-orange-200",
    header: "bg-orange-50/80",
    dot: "bg-orange-800",
    activeRow: "bg-orange-50 border-l-2 border-l-orange-800 text-orange-950",
  },
  SELECT: {
    pill: "bg-emerald-100 text-emerald-900 border-emerald-300",
    icon: "text-emerald-800",
    border: "border-emerald-300",
    header: "bg-emerald-50",
    dot: "bg-emerald-700",
    activeRow: "bg-emerald-100 border-l-2 border-l-emerald-700 text-emerald-950",
  },
  ORDER_BY: {
    pill: "bg-teal-100 text-teal-900 border-teal-300",
    icon: "text-teal-800",
    border: "border-teal-300",
    header: "bg-teal-50",
    dot: "bg-teal-700",
    activeRow: "bg-teal-100 border-l-2 border-l-teal-700 text-teal-950",
  },
  LIMIT: {
    pill: "bg-red-100 text-red-900 border-red-300",
    icon: "text-red-800",
    border: "border-red-300",
    header: "bg-red-50",
    dot: "bg-red-700",
    activeRow: "bg-red-100 border-l-2 border-l-red-700 text-red-950",
  },
};

export const STAGE_SUBTITLES: Record<SimulatorStageType, string> = {
  FROM: "Loading source rows",
  JOIN: "Matching rows across tables",
  WHERE: "Filtering rows with a condition",
  GROUP_BY: "Collapsing rows into groups",
  HAVING: "Filtering grouped results",
  SELECT: "Projecting output columns",
  ORDER_BY: "Sorting the visible rows",
  LIMIT: "Keeping only the first rows",
};

export const STAGE_HINTS: Record<SimulatorStageType, string[]> = {
  FROM: [
    "These are all rows before any filtering.",
    "Each row has a stable _rowId for tracking.",
    "Column types and NULLs are preserved exactly.",
  ],
  JOIN: [
    "Only rows where the ON condition is true are matched.",
    "LEFT JOIN keeps all left-table rows, filling unmatched right columns with NULL.",
    "Row count can increase when one left row matches many right rows.",
  ],
  WHERE: [
    "The condition is evaluated row by row.",
    "Rows where the condition is false or NULL are removed.",
    "Removed rows appear in red so you can see exactly what changed.",
  ],
  GROUP_BY: [
    "Rows collapse into one row per unique group key.",
    "Only GROUP BY columns and aggregate outputs remain.",
    "Non-grouped, non-aggregate columns are dropped here.",
  ],
  HAVING: [
    "HAVING runs after grouping, not before it.",
    "The condition evaluates aggregate values like COUNT and SUM.",
    "Groups failing the condition are removed entirely.",
  ],
  SELECT: [
    "Columns not in SELECT are dropped at this stage.",
    "Aliases from AS are applied here.",
    "Expressions and calculations are evaluated now.",
  ],
  ORDER_BY: [
    "Row values do not change, only their order changes.",
    "Watch rows move to their sorted positions.",
    "In PostgreSQL ASC order, NULL values are last by default.",
  ],
  LIMIT: [
    "Rows past the LIMIT are removed from the bottom.",
    "Those removed rows are shown in red.",
    "OFFSET would skip rows before LIMIT is applied.",
  ],
};

export const STAGE_ACCENT: Record<SimulatorStageType, { border: string; dot: string }> = {
  FROM: { border: "border-l-stone-600", dot: "bg-stone-600" },
  JOIN: { border: "border-l-orange-700", dot: "bg-orange-700" },
  WHERE: { border: "border-l-amber-700", dot: "bg-amber-700" },
  GROUP_BY: { border: "border-l-rose-700", dot: "bg-rose-700" },
  HAVING: { border: "border-l-orange-800", dot: "bg-orange-800" },
  SELECT: { border: "border-l-emerald-700", dot: "bg-emerald-700" },
  ORDER_BY: { border: "border-l-teal-700", dot: "bg-teal-700" },
  LIMIT: { border: "border-l-red-700", dot: "bg-red-700" },
};

export function diffRowCounts(diff: StageDiff | null) {
  const rows = diff?.rowDiffs ?? [];
  return {
    removed: rows.filter((d) => d.status === "removed").length,
    added: rows.filter((d) => d.status === "added").length,
    reordered: rows.filter((d) => d.status === "reordered").length,
    nullRows: rows.filter((d) => d.status === "null-introduced").length,
    hiddenCols: (diff?.columnDiffs ?? []).filter((c) => c.status === "hidden").length,
  };
}

export function buildDiffSummary(diff: StageDiff, stageType: SimulatorStageType): string | null {
  const counts = diffRowCounts(diff);
  const parts: string[] = [];
  switch (stageType) {
    case "WHERE":
    case "HAVING":
      if (counts.removed > 0) parts.push(`${counts.removed} row${counts.removed === 1 ? "" : "s"} removed`);
      break;
    case "JOIN":
      if (counts.added > 0) parts.push(`${counts.added} row${counts.added === 1 ? "" : "s"} matched`);
      if (counts.nullRows > 0) parts.push(`${counts.nullRows} row${counts.nullRows === 1 ? "" : "s"} got NULLs`);
      break;
    case "SELECT":
      if (counts.hiddenCols > 0) parts.push(`${counts.hiddenCols} column${counts.hiddenCols === 1 ? "" : "s"} hidden`);
      break;
    case "ORDER_BY":
      if (counts.reordered > 0) parts.push(`${counts.reordered} row${counts.reordered === 1 ? "" : "s"} reordered`);
      break;
    case "LIMIT":
      if (counts.removed > 0) parts.push(`${counts.removed} row${counts.removed === 1 ? "" : "s"} dropped`);
      break;
    default:
      break;
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function getRemovedRows(
  prevSnapshot: SimulatorSnapshot | null,
  diff: StageDiff | null
): RowDiff[] {
  if (!prevSnapshot || !diff) return [];
  const prevById = new Set(prevSnapshot.rows.map((row) => row._rowId));
  return diff.rowDiffs.filter((row) => row.status === "removed" && prevById.has(row.rowId));
}

/** Column keys + display labels for intermediate (join result) tables. */
export function getIntermediateResultColumns(
  row: TrackedRow
): Array<{ key: string; label: string }> {
  const keys = Object.keys(row).filter((k) => k !== "_rowId");
  return keys.map((key, index) => ({
    key,
    label: index === 0 && key === "id" ? "temp_id" : key,
  }));
}
