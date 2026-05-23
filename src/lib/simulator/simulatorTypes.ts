export type SimulatorStageType =
  | "FROM"
  | "JOIN"
  | "WHERE"
  | "SELECT"
  | "ORDER_BY"
  | "LIMIT";

export type SimulatorStage = {
  id: string;
  type: SimulatorStageType;
  label: string;
  description: string;
};

export type SimulatorPipeline = {
  stages: SimulatorStage[];
  sql: string;
};

export type SimulatorResult =
  | { ok: true; pipeline: SimulatorPipeline }
  | { ok: false; error: string };
