export type SimulatorStageType =
  | "FROM"
  | "JOIN"
  | "WHERE"
  | "GROUP_BY"
  | "HAVING"
  | "SELECT"
  | "ORDER_BY"
  | "LIMIT";

export type SimulatorStage = {
  id: string;
  type: SimulatorStageType;
  label: string;
  description: string;
  /**
   * 0-based index into the JOIN items array for multi-JOIN queries.
   * Undefined for all non-JOIN stages and single-JOIN queries.
   * joinIndex=0 → first JOIN, joinIndex=1 → second JOIN, etc.
   */
  joinIndex?: number;
};

export type SimulatorPipeline = {
  stages: SimulatorStage[];
  sql: string;
};

export type SimulatorResult =
  | { ok: true; pipeline: SimulatorPipeline }
  | { ok: false; error: string };
