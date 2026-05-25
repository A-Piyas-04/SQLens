// Types
export type {
  SimulatorStageType,
  SimulatorStage,
  SimulatorPipeline,
  SimulatorResult,
} from "./types/simulatorTypes";

export type {
  TrackedRow,
  SimulatorSnapshot,
  RowStatus,
  RowDiff,
  ColumnDiff,
  StageDiff,
  SnapshotResult,
} from "./types/snapshotTypes";

// SQL
export { parseSql } from "./sql/parseSql";
export type { ParseResult } from "./sql/parseSql";
export { validateSqlSupport } from "./sql/supportedSql";
export type { ValidationResult } from "./sql/supportedSql";
export { buildStageSql, buildRightTableSql, selectHasJoin } from "./sql/buildStageSql";
export type { StageSqlResult } from "./sql/buildStageSql";

// Pipeline
export { buildPipeline } from "./pipeline/buildPipeline";

// Snapshot
export { generateSnapshots } from "./snapshot/generateSnapshots";
export { assignRowIds } from "./snapshot/assignRowIds";
export { diffSnapshots } from "./snapshot/diffSnapshots";
