import type {
  SimulatorSnapshot,
  StageDiff,
  RowDiff,
  ColumnDiff,
  RowStatus,
  TrackedRow,
} from "../types/snapshotTypes";
import type { SimulatorStageType } from "../types/simulatorTypes";

/**
 * Computes the diff between two consecutive stage snapshots.
 *
 * Row identity is determined by `_rowId` (assigned by `assignRowIds`).
 * The diff captures:
 *   - removed  — rows present in prev but absent in curr
 *   - added    — rows present in curr but absent in prev
 *   - reordered — same _rowId whose order relative to other survivors changed
 *   - null-introduced — same _rowId but a column transitioned non-NULL → NULL
 *   - unchanged — same _rowId, same index, no NULL changes
 *
 * Column diffs detect hidden columns: columns in prev that are absent from curr
 * (SELECT projection).
 *
 * Each RowDiff also receives a human-readable `reason` string based on the
 * destination stage type (Phase 4.6 explanation metadata).
 */
export function diffSnapshots(
  prev: SimulatorSnapshot,
  curr: SimulatorSnapshot
): StageDiff {
  const prevRows = prev.rows as TrackedRow[];
  const currRows = curr.rows as TrackedRow[];

  const prevIndexById = new Map<string, number>(
    prevRows.map((r, i) => [r._rowId, i])
  );
  const currIndexById = new Map<string, number>(
    currRows.map((r, i) => [r._rowId, i])
  );

  const rowDiffs: RowDiff[] = [];

  // Survivors whose relative order is preserved form the longest increasing
  // subsequence of previous indices; only rows outside it actually moved.
  const survivorIds = currRows
    .map((r) => r._rowId)
    .filter((id) => prevIndexById.has(id));
  const stableIds = findStableIds(
    survivorIds,
    survivorIds.map((id) => prevIndexById.get(id)!)
  );

  // ── Removed rows (in prev, absent from curr) ──────────────────────────────
  for (const [rowId, prevIndex] of prevIndexById) {
    if (!currIndexById.has(rowId)) {
      rowDiffs.push({
        rowId,
        status: "removed",
        prevIndex,
        reason: buildRemovedReason(curr.stageType, curr.rowCount),
      });
    }
  }

  // ── Rows present in curr ──────────────────────────────────────────────────
  for (const [rowId, currIndex] of currIndexById) {
    const prevIndex = prevIndexById.get(rowId);

    if (prevIndex === undefined) {
      // Added — brand-new row in curr (JOIN expansion, etc.)
      const currRow = currRows[currIndex];
      const nullCols = Object.keys(currRow).filter(
        (k) => k !== "_rowId" && currRow[k] === null
      );
      rowDiffs.push({
        rowId,
        status: "added",
        currIndex,
        nullColumns: nullCols.length > 0 ? nullCols : undefined,
        reason: buildAddedReason(curr.stageType, nullCols.length > 0),
      });
    } else {
      // Row exists in both — check for NULL introduction or reorder.
      const prevRow = prevRows[prevIndex];
      const currRow = currRows[currIndex];

      const nullIntroduced = Object.keys(currRow).filter(
        (k) =>
          k !== "_rowId" &&
          k in prevRow &&
          prevRow[k] !== null &&
          currRow[k] === null
      );

      let status: RowStatus;
      if (nullIntroduced.length > 0) {
        status = "null-introduced";
      } else if (!stableIds.has(rowId)) {
        status = "reordered";
      } else {
        status = "unchanged";
      }

      const diff: RowDiff = { rowId, status, prevIndex, currIndex };

      if (nullIntroduced.length > 0) {
        diff.nullColumns = nullIntroduced;
        diff.reason = `NULL introduced in: ${nullIntroduced.join(", ")}`;
      }

      rowDiffs.push(diff);
    }
  }

  // ── Column diffs (hidden columns from SELECT projection) ──────────────────
  const prevCols =
    prevRows.length > 0
      ? Object.keys(prevRows[0]).filter((k) => k !== "_rowId")
      : [];
  const currCols =
    currRows.length > 0
      ? Object.keys(currRows[0]).filter((k) => k !== "_rowId")
      : [];
  const currColSet = new Set(currCols);

  const columnDiffs: ColumnDiff[] = [
    // Columns from prev — mark as present or hidden
    ...prevCols.map((col) => ({
      column: col,
      status: (currColSet.has(col) ? "present" : "hidden") as ColumnDiff["status"],
    })),
    // Columns new to curr (not in prev) — always present
    ...currCols
      .filter((col) => !prevCols.includes(col))
      .map((col) => ({ column: col, status: "present" as const })),
  ];

  return {
    fromStageId: prev.stageId,
    toStageId: curr.stageId,
    rowDiffs,
    columnDiffs,
  };
}

/**
 * Returns the ids that belong to one longest increasing subsequence of
 * `prevIndices` (O(n log n) patience sort). Ids outside it are true movers.
 */
export function findStableIds(ids: string[], prevIndices: number[]): Set<string> {
  const n = prevIndices.length;
  const tailIdx: number[] = [];
  const parent = new Array<number>(n).fill(-1);

  for (let i = 0; i < n; i++) {
    const v = prevIndices[i];
    let lo = 0;
    let hi = tailIdx.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (prevIndices[tailIdx[mid]] < v) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) parent[i] = tailIdx[lo - 1];
    tailIdx[lo] = i;
  }

  const stable = new Set<string>();
  let k = tailIdx.length > 0 ? tailIdx[tailIdx.length - 1] : -1;
  while (k >= 0) {
    stable.add(ids[k]);
    k = parent[k];
  }
  return stable;
}

// ── Reason builders ──────────────────────────────────────────────────────────

function buildRemovedReason(
  destStage: SimulatorStageType,
  destRowCount: number
): string {
  switch (destStage) {
    case "WHERE":
      return "Filtered out by WHERE condition";
    case "HAVING":
      return "Group eliminated by HAVING condition";
    case "LIMIT":
      return `Dropped — exceeds LIMIT ${destRowCount}`;
    default:
      return "Removed at this stage";
  }
}

function buildAddedReason(
  destStage: SimulatorStageType,
  hasNulls: boolean
): string {
  if (destStage === "JOIN") {
    if (hasNulls) {
      return "No match found in right table — NULLs introduced";
    }
    return "Matched via ON condition";
  }
  return "Introduced at this stage";
}
