import { Parser, type Select } from "node-sql-parser";

import type { SimulatorStageType } from "../types/simulatorTypes";

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
 * Same dual-clear for HAVING (`having` / `_having`).
 */
function clearHaving(ast: Select): void {
  ast.having = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ast as any)._having = null;
}

/**
 * Same dual-clear for GROUP BY (`groupby` / `_groupby`).
 * node-sql-parser types `groupby` as non-nullable, so we use any-cast.
 */
function clearGroupBy(ast: Select): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ast as any).groupby = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ast as any)._groupby = null;
}

/**
 * Extracts the numeric LIMIT value from the AST.
 * Returns undefined if LIMIT is absent or the value cannot be determined.
 */
function getLimitValue(select: Select): number | undefined {
  const val = select.limit?.value?.[0]?.value;
  return typeof val === "number" ? val : undefined;
}

/**
 * Returns true if the FROM list contains any JOIN items.
 */
export function selectHasJoin(select: Select): boolean {
  return Array.isArray(select.from) && select.from.some((item) => "join" in item);
}

export type StageSqlResult =
  | { ok: true; sql: string }
  | { ok: false; reason: string };

/**
 * Generates an executable SQL string for a given logical execution stage.
 *
 * Stages progressively add clauses following SQL's logical execution order:
 * FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
 *
 * The FROM and WHERE stages use SELECT * to expose all columns before
 * projection. The LIMIT value is always appended manually rather than
 * via sqlify, since node-sql-parser's PostgreSQL sqlify may omit it when
 * the _limit field is not explicitly populated.
 */
export function buildStageSql(
  select: Select,
  stageType: SimulatorStageType,
  /**
   * For JOIN stages in multi-JOIN queries: 0-based index of the join to
   * include. SQL is built with joins 0..joinIndex so each stage shows the
   * cumulative working table up to that join.
   * Omit (or pass undefined) to include all joins (single-JOIN queries).
   */
  joinIndex?: number
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
        clearGroupBy(ast);
        clearHaving(ast);
        ast.distinct = null;
        // Strip JOIN items — FROM stage shows only the base table alone.
        if (Array.isArray(ast.from)) {
          ast.from = ast.from.filter((item) => !("join" in item));
        }
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "JOIN": {
        // SELECT *, no WHERE, no ORDER BY, no GROUP BY, no HAVING, no LIMIT.
        // For multi-JOIN: include only joins 0..joinIndex (cumulative working table).
        const ast = cloneSelect(select);
        ast.columns = STAR_COLUMN as Select["columns"];
        ast.where = null;
        clearOrderBy(ast);
        clearLimit(ast);
        clearGroupBy(ast);
        clearHaving(ast);
        ast.distinct = null;

        if (joinIndex !== undefined && Array.isArray(ast.from)) {
          const baseItems = ast.from.filter((item) => !("join" in item));
          const joinOnlyItems = ast.from
            .filter((item) => "join" in item)
            .slice(0, joinIndex + 1);
          ast.from = [...baseItems, ...joinOnlyItems];
        }

        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "WHERE": {
        const ast = cloneSelect(select);
        ast.columns = STAR_COLUMN as Select["columns"];
        clearOrderBy(ast);
        clearLimit(ast);
        clearGroupBy(ast);
        clearHaving(ast);
        ast.distinct = null;
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "GROUP_BY": {
        // Keep: FROM, JOINs, WHERE, GROUP BY, original SELECT columns.
        // Remove: HAVING, ORDER BY, LIMIT.
        const ast = cloneSelect(select);
        clearHaving(ast);
        clearOrderBy(ast);
        clearLimit(ast);
        stageSql = parser.sqlify(ast, { database: "PostgreSQL" });
        break;
      }

      case "HAVING": {
        // Keep: FROM, JOINs, WHERE, GROUP BY, HAVING, original SELECT columns.
        // Remove: ORDER BY, LIMIT.
        const ast = cloneSelect(select);
        clearOrderBy(ast);
        clearLimit(ast);
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

/**
 * Builds an executable SQL string for the right-hand table of a JOIN, used
 * by the JOIN canvas to retrieve the raw right-table rows for visualization.
 *
 * `joinIndex` selects which join item to target (0-based, default 0).
 * Returns null if the AST has no JOIN item at that index or if sqlify fails.
 */
export function buildRightTableSql(select: Select, joinIndex = 0): string | null {
  const parser = getParser();
  const froms = Array.isArray(select.from) ? select.from : [];
  const joinItems = froms.filter((item) => "join" in item);
  const joinItem = joinItems[joinIndex];
  if (!joinItem || !("table" in joinItem)) return null;

  try {
    const ast = cloneSelect(select);
    ast.columns = STAR_COLUMN as Select["columns"];
    ast.where = null;
    clearOrderBy(ast);
    clearLimit(ast);
    clearGroupBy(ast);
    clearHaving(ast);
    ast.distinct = null;
    // Keep only the right-side table (the join item, treated as a plain FROM).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rightItem = { ...(joinItem as any) };
    delete rightItem.join;
    delete rightItem.on;
    ast.from = [rightItem];
    return parser.sqlify(ast, { database: "PostgreSQL" });
  } catch {
    return null;
  }
}
