import type { TrackedRow } from "../../../../lib/simulator";

/** Visible rows while focus-on-changes is on. */
export const FOCUS_ROW_LIMIT = 12;
/** Maximum affected rows kept in view. */
export const MAX_AFFECTED_ROWS = 8;
/** Visible rows when the user turns focus-on-changes off. */
export const FULL_ROW_LIMIT = 200;

export type RowWindow = { rows: TrackedRow[]; hiddenCount: number };

/**
 * Focus-on-change windowing: keep affected rows (≤ 8) and their immediate
 * neighbours, fill remaining slots from the top, preserve source order, and
 * summarise everything else as "+ N other rows".
 */
export function windowRows(
  rows: TrackedRow[],
  important: Iterable<string>,
  limit: number
): RowWindow {
  if (rows.length <= limit) return { rows, hiddenCount: 0 };

  const indexById = new Map(rows.map((r, i) => [r._rowId, i]));
  const keep = new Set<number>();
  let affected = 0;
  for (const id of important) {
    const i = indexById.get(id);
    if (i === undefined) continue;
    if (affected >= MAX_AFFECTED_ROWS || keep.size >= limit) break;
    keep.add(i);
    affected += 1;
  }
  // Neighbours give context for where a change happened.
  for (const i of [...keep]) {
    if (keep.size >= limit) break;
    if (i > 0) keep.add(i - 1);
    if (keep.size >= limit) break;
    if (i < rows.length - 1) keep.add(i + 1);
  }
  for (let i = 0; i < rows.length && keep.size < limit; i++) keep.add(i);

  const shown = [...keep].sort((a, b) => a - b).map((i) => rows[i]);
  return { rows: shown, hiddenCount: rows.length - shown.length };
}

export function otherRowsLabel(n: number, noun = "row"): string {
  return `+ ${n} other ${noun}${n === 1 ? "" : "s"}`;
}
