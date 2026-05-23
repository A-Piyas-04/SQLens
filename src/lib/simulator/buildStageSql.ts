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

/**
 * Nulls out the LIMIT clause on both the standard field (`limit`) and the
 * PostgreSQL-dialect underscore variant (`_limit`). node-sql-parser's sqlify
 * may read either depending on the dialect option — clearing only one field
 * leaves the other in place and the clause silently reappears in output.
 */
function clearLimit(ast: Select): void {
  ast.limit = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ast as any)._limit = null;
}

/**
 * Same dual-clear for ORDER BY (`orderby` / `_orderby`).
 */
function clearOrderBy(ast: Select): void {
  ast.orderby = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ast as any)._orderby = null;
}

/**
 * Extracts the numeric LIMIT value from the AST.
 * Returns undefined if LIMIT is absent or the value cannot be determined.
 */
function getLimitValue(select: Select): number | undefined {
  const val = select.limit?.value?.[0]?.value;
  return typeof val === "number" ? val : undefined;
}

export type StageSqlResult =
  | { ok: true; sql: string }
  | { ok: false; reason: string };

/**
 * Generates an executable SQL string for a given logical execution stage.
 *
 * Stages progressively add clauses following SQL's logical execution order:
 * FROM → WHERE → SELECT (projection) → ORDER BY → LIMIT
 *
 * The FROM and WHERE stages use SELECT * to expose all columns before
 * projection. The LIMIT value is always appended manually rather than
 * via sqlify, since node-sql-parser's PostgreSQL sqlify may omit it when
 * the _limit field is not explicitly populated.
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
        clearOrderBy(ast);
        clearLimit(ast);
        ast.distinct = null;
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "WHERE": {
        const ast = cloneSelect(select);
        ast.columns = STAR_COLUMN as Select["columns"];
        clearOrderBy(ast);
        clearLimit(ast);
        ast.distinct = null;
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "SELECT": {
        const ast = cloneSelect(select);
        clearOrderBy(ast);
        clearLimit(ast);
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "ORDER_BY": {
        const ast = cloneSelect(select);
        clearLimit(ast);
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "LIMIT": {
        // Build from the same base as ORDER_BY (keeps ORDER BY, drops LIMIT).
        // Then append LIMIT explicitly — sqlify may omit it in PostgreSQL mode
        // when _limit is not separately populated by the parser.
        const ast = cloneSelect(select);
        clearLimit(ast);
        const baseSql = parser.sqlify(ast, { database: "PostgreSQL" });

        const limitVal = getLimitValue(select);
        stageSql =
          limitVal !== undefined ? `${baseSql} LIMIT ${limitVal}` : baseSql;
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

    console.debug(`[Simulator] ${stageType} →`, stageSql);
    return { ok: true, sql: stageSql };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `SQL generation failed: ${message}` };
  }
}
