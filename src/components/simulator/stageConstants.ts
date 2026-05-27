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

import type { RowDiff, SimulatorSnapshot, SimulatorStageType, StageDiff } from "../../lib/simulator";

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
    pill: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    icon: "text-blue-400",
    border: "border-blue-500/20",
    header: "bg-blue-500/8",
    dot: "bg-blue-400",
    activeRow: "bg-blue-500/15 border-l-2 border-l-blue-400 text-blue-200",
  },
  JOIN: {
    pill: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    icon: "text-purple-400",
    border: "border-purple-500/20",
    header: "bg-purple-500/8",
    dot: "bg-purple-400",
    activeRow: "bg-purple-500/15 border-l-2 border-l-purple-400 text-purple-200",
  },
  WHERE: {
    pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: "text-amber-400",
    border: "border-amber-500/20",
    header: "bg-amber-500/8",
    dot: "bg-amber-400",
    activeRow: "bg-amber-500/15 border-l-2 border-l-amber-400 text-amber-200",
  },
  GROUP_BY: {
    pill: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    icon: "text-violet-400",
    border: "border-violet-500/20",
    header: "bg-violet-500/8",
    dot: "bg-violet-400",
    activeRow: "bg-violet-500/15 border-l-2 border-l-violet-400 text-violet-200",
  },
  HAVING: {
    pill: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    icon: "text-orange-400",
    border: "border-orange-500/20",
    header: "bg-orange-500/8",
    dot: "bg-orange-400",
    activeRow: "bg-orange-500/15 border-l-2 border-l-orange-400 text-orange-200",
  },
  SELECT: {
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
    header: "bg-emerald-500/8",
    dot: "bg-emerald-400",
    activeRow: "bg-emerald-500/15 border-l-2 border-l-emerald-400 text-emerald-200",
  },
  ORDER_BY: {
    pill: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    icon: "text-sky-400",
    border: "border-sky-500/20",
    header: "bg-sky-500/8",
    dot: "bg-sky-400",
    activeRow: "bg-sky-500/15 border-l-2 border-l-sky-400 text-sky-200",
  },
  LIMIT: {
    pill: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: "text-rose-400",
    border: "border-rose-500/20",
    header: "bg-rose-500/8",
    dot: "bg-rose-400",
    activeRow: "bg-rose-500/15 border-l-2 border-l-rose-400 text-rose-200",
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
  FROM: { border: "border-l-blue-500/60", dot: "bg-blue-400" },
  JOIN: { border: "border-l-purple-500/60", dot: "bg-purple-400" },
  WHERE: { border: "border-l-amber-500/60", dot: "bg-amber-400" },
  GROUP_BY: { border: "border-l-violet-500/60", dot: "bg-violet-400" },
  HAVING: { border: "border-l-orange-500/60", dot: "bg-orange-400" },
  SELECT: { border: "border-l-emerald-500/60", dot: "bg-emerald-400" },
  ORDER_BY: { border: "border-l-sky-500/60", dot: "bg-sky-400" },
  LIMIT: { border: "border-l-rose-500/60", dot: "bg-rose-400" },
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
