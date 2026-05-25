import type { AST, Join, Select } from "node-sql-parser";

import type {
  SimulatorPipeline,
  SimulatorStage,
  SimulatorStageType,
} from "../types/simulatorTypes";

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
  GROUP_BY: {
    label: "GROUP BY",
    description:
      "Collapse rows into groups by the specified columns and compute aggregates.",
  },
  HAVING: {
    label: "HAVING",
    description:
      "Filter groups using the HAVING condition — only matching groups continue.",
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
 * the written order:
 *   FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
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

  // 2. JOIN — one stage per JOIN item so learners see each join step-by-step.
  //    Label: "LEFT JOIN orders", "INNER JOIN departments", etc.
  const joinItems = froms.filter((item) => "join" in item) as Join[];
  for (let i = 0; i < joinItems.length; i++) {
    const jItem = joinItems[i];
    const rawType = (jItem.join as string).toUpperCase();
    // Normalise shorthand: bare "JOIN" → "INNER JOIN"
    const displayType =
      rawType === "JOIN" || rawType === "INNER JOIN" ? "INNER JOIN"
      : rawType === "LEFT JOIN" || rawType === "LEFT OUTER JOIN" ? "LEFT JOIN"
      : rawType;
    const tableName =
      "table" in jItem && jItem.table ? String(jItem.table) : "joined_table";
    stages.push({
      id:          `stage-${index}-join-${i}`,
      type:        "JOIN",
      label:       `${displayType} ${tableName}`,
      description: `Combine with "${tableName}" using the ON condition.`,
      joinIndex:   i,
    });
    index++;
  }

  // 3. WHERE — row filtering
  if (select.where) {
    stages.push(makeStage("WHERE", index++));
  }

  // 4. GROUP BY — aggregation
  if (select.groupby?.columns && select.groupby.columns.length > 0) {
    stages.push(makeStage("GROUP_BY", index++));
  }

  // 5. HAVING — group filtering (only valid after GROUP BY).
  // node-sql-parser represents `having` as a single expression object (not an
  // array), so we test for presence only, not `.length`.
  if (select.having) {
    stages.push(makeStage("HAVING", index++));
  }

  // 6. SELECT — always present for a SELECT query
  stages.push(makeStage("SELECT", index++));

  // 7. ORDER BY — sorting
  if (select.orderby && select.orderby.length > 0) {
    stages.push(makeStage("ORDER_BY", index++));
  }

  // 8. LIMIT — row count restriction.
  // node-sql-parser sometimes populates `limit` with an empty value array as a
  // parser artefact (e.g. `WHERE gpa > 3`).  Only add a LIMIT stage when the
  // value array is non-empty and contains an actual numeric value.
  const limitVal = select.limit?.value?.[0]?.value;
  if (limitVal !== undefined && limitVal !== null) {
    stages.push(makeStage("LIMIT", index++));
  }

  return { stages, sql };
}
