import { Parser, type Select } from "node-sql-parser";

import type { SimulatorStageType } from "./simulatorTypes";

let _parser: Parser | null = null;

function getParser(): Parser {
  if (!_parser) {
    _parser = new Parser();
  }
  return _parser;
}

/** Column node that represents SELECT * */
const STAR_COLUMN = [{ expr: { type: "star", value: "*" }, as: null }];

/**
 * Deep-clones a Select AST via JSON round-trip.
 * Safe because node-sql-parser ASTs are plain serializable objects.
 */
function cloneSelect(select: Select): Select {
  return JSON.parse(JSON.stringify(select)) as Select;
}

export type StageSqlResult =
  | { ok: true; sql: string }
  | { ok: false; reason: string };

/**
 * Generates an executable SQL string for a given logical execution stage.
 *
 * Each stage progressively adds clauses in SQL's logical execution order:
 * FROM → WHERE → SELECT (projection) → ORDER BY → LIMIT
 *
 * The FROM and WHERE stages use SELECT * to show all columns before projection.
 */
export function buildStageSql(
  select: Select,
  stageType: SimulatorStageType
): StageSqlResult {
  const parser = getParser();

  try {
    let stageSql: string;

    switch (stageType) {
      case "FROM": {
        const ast = cloneSelect(select);
        ast.columns = STAR_COLUMN as Select["columns"];
        ast.where = null;
        ast.orderby = null;
        ast.limit = null;
        ast.distinct = null;
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "WHERE": {
        const ast = cloneSelect(select);
        ast.columns = STAR_COLUMN as Select["columns"];
        ast.orderby = null;
        ast.limit = null;
        ast.distinct = null;
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "SELECT": {
        const ast = cloneSelect(select);
        ast.orderby = null;
        ast.limit = null;
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "ORDER_BY": {
        const ast = cloneSelect(select);
        ast.limit = null;
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "LIMIT": {
        // Full original query — identical to what the user wrote
        stageSql = parser.sqlify(select, { database: "PostgreSQL" });
        break;
      }

      case "JOIN": {
        return {
          ok: false,
          reason: "JOIN snapshot generation is not supported yet.",
        };
      }

      default: {
        return {
          ok: false,
          reason: `Unknown stage type: ${stageType as string}`,
        };
      }
    }

    return { ok: true, sql: stageSql };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `SQL generation failed: ${message}` };
  }
}
