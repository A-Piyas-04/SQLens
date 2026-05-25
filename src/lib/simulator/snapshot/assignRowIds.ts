import type { TrackedRow } from "../types/snapshotTypes";

/**
 * Assigns stable `_rowId` values to a set of rows produced by a stage.
 *
 * Strategy:
 * - If `prevRows` is null (FROM stage), assign sequential IDs: "row-0", "row-1", …
 * - Otherwise, for each row in `currentRows`, find the first *unused* row in
 *   `prevRows` whose values match on every column they share.  If a match is
 *   found the previous `_rowId` is reused, preserving identity across
 *   WHERE (subset), ORDER BY (reorder), LIMIT (truncation), SELECT
 *   (projection), and JOIN (expansion) stages.
 * - Rows with no match in `prevRows` (new rows introduced by a JOIN or any
 *   other expansion) receive a fresh ID: "row-new-{n}".
 *
 * NULL equality: two NULL values are considered equal (matching), consistent
 * with the visual purpose of tracking rows rather than SQL semantics.
 */
export function assignRowIds(
  currentRows: Record<string, unknown>[],
  prevRows: TrackedRow[] | null
): TrackedRow[] {
  if (prevRows === null || prevRows.length === 0) {
    return currentRows.map((row, i) => ({ ...row, _rowId: `row-${i}` }));
  }

  const usedPrevIds = new Set<string>();
  let newCount = 0;

  return currentRows.map((row) => {
    // Columns that exist in both the current row and the previous rows,
    // excluding the internal _rowId field.
    const commonCols = Object.keys(prevRows[0]).filter(
      (k) => k !== "_rowId" && k in row
    );

    // Find the first unused previous row whose common column values all match.
    const match = prevRows.find((prev) => {
      if (usedPrevIds.has(prev._rowId)) return false;
      return commonCols.every((col) => {
        const a = prev[col];
        const b = row[col];
        if (a === null && b === null) return true;
        // PGlite may return numbers as strings; normalise before comparison.
        return String(a) === String(b);
      });
    });

    if (match) {
      usedPrevIds.add(match._rowId);
      return { ...row, _rowId: match._rowId };
    }

    return { ...row, _rowId: `row-new-${newCount++}` };
  });
}
