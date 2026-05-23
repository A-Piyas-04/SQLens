import type { SimulatorStageType } from "./simulatorTypes";

export type SimulatorSnapshot = {
  stageId: string;
  stageType: SimulatorStageType;
  label: string;
  sql: string;
  rows: Record<string, unknown>[];
  rowCount: number;
  annotation: string;
};

export type SnapshotResult =
  | { success: true; snapshots: SimulatorSnapshot[] }
  | { success: false; error: string };
