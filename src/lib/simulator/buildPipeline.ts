import type { AST, Select } from "node-sql-parser";

import type {
  SimulatorPipeline,
  SimulatorStage,
  SimulatorStageType,
} from "./simulatorTypes";

const STAGE_METADATA: Record<
  SimulatorStageType,
  { label: string; description: string }
> = {
  FROM: {
    label: "FROM",
    description: "Load source table(s) into memory as the starting dataset.",
  },
  JOIN: {
    label: "JOIN",
    description: "Combine rows from joined tables based on ON conditions.",
  },
  WHERE: {
    label: "WHERE",
    description:
      "Filter rows using the WHERE condition — only matching rows continue.",
  },
  SELECT: {
    label: "SELECT",
    description:
      "Project the specified columns and compute any expressions.",
  },
  ORDER_BY: {
    label: "ORDER BY",
    description:
      "Sort the result set by the specified columns and direction.",
  },
  LIMIT: {
    label: "LIMIT",
    description: "Return only the first N rows from the sorted result.",
  },
};

function makeStage(type: SimulatorStageType, index: number): SimulatorStage {
  const meta = STAGE_METADATA[type];
  return {
    id: `stage-${index}-${type.toLowerCase()}`,
    type,
    label: meta.label,
    description: meta.description,
  };
}

/**
 * Converts a parsed SELECT AST into a logical SQL execution pipeline.
 *
 * The pipeline follows SQL's logical execution order, which differs from
 * the written order: FROM → JOIN → WHERE → SELECT → ORDER BY → LIMIT.
 */
export function buildPipeline(ast: AST, sql: string): SimulatorPipeline {
  if (ast.type !== "select") {
    return { stages: [], sql };
  }

  const select = ast as Select;
  const stages: SimulatorStage[] = [];
  let index = 0;

  // 1. FROM — source tables
  const froms = Array.isArray(select.from) ? select.from : [];
  if (froms.length > 0) {
    stages.push(makeStage("FROM", index++));
  }

  // 2. JOIN — detected when any FROM item has a `join` property
  const hasJoin = froms.some((item) => "join" in item);
  if (hasJoin) {
    stages.push(makeStage("JOIN", index++));
  }

  // 3. WHERE — row filtering
  if (select.where) {
    stages.push(makeStage("WHERE", index++));
  }

  // 4. SELECT — always present for a SELECT query
  stages.push(makeStage("SELECT", index++));

  // 5. ORDER BY — sorting
  if (select.orderby && select.orderby.length > 0) {
    stages.push(makeStage("ORDER_BY", index++));
  }

  // 6. LIMIT — row count restriction
  if (select.limit) {
    stages.push(makeStage("LIMIT", index++));
  }

  return { stages, sql };
}
