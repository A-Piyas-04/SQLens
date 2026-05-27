import type { SimulatorStageType } from "./simulatorTypes";

/** A row with a stable cross-stage identifier assigned in JavaScript. */
export type TrackedRow = Record<string, unknown> & { _rowId: string };

export type SimulatorSnapshot = {
  stageId: string;
  stageType: SimulatorStageType;
  label: string;
  sql: string;
  rows: TrackedRow[];
  rowCount: number;
  annotation: string;
  /**
   * Raw rows from the right-hand table of a JOIN, populated only for JOIN
   * stages. Used by SimulatorJoinCanvas to draw row-match lines.
   */
  rightTableRows?: TrackedRow[];
  /** 0-based index of this JOIN in multi-join queries. */
  joinIndex?: number;
  /** Table name of the right-hand side being joined at this stage. */
  joinRightTable?: string;
};

// ── Diff types ──────────────────────────────────────────────────────────────

export type RowStatus =
  | "unchanged"
  | "removed"
  | "added"
  | "reordered"
  | "null-introduced";

export type RowDiff = {
  rowId: string;
  status: RowStatus;
  /** Row index in the previous snapshot (undefined for purely added rows). */
  prevIndex?: number;
  /** Row index in the current snapshot (undefined for removed rows). */
  currIndex?: number;
  /** Columns where a non-NULL value became NULL (LEFT JOIN NULL introduction). */
  nullColumns?: string[];
  /** Human-readable explanation of why this row changed. */
  reason?: string;
};

export type ColumnDiff = {
  column: string;
  status: "present" | "hidden";
};

export type StageDiff = {
  fromStageId: string;
  toStageId: string;
  rowDiffs: RowDiff[];
  columnDiffs: ColumnDiff[];
};

// ── Result types ─────────────────────────────────────────────────────────────

export type SnapshotResult =
  | { success: true; snapshots: SimulatorSnapshot[]; diffs: StageDiff[] }
  | { success: false; error: string };
