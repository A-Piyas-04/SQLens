import type { SimulatorStageType } from "../../../../lib/simulator";
import { getClauseRangeForStage } from "../../../../lib/simulator/sql/clauseRanges";

const SQL_WORDS = new Set([
  "select", "from", "where", "and", "or", "not", "in", "is", "null", "like", "ilike",
  "between", "as", "on", "join", "left", "right", "inner", "outer", "full", "cross",
  "group", "by", "having", "order", "asc", "desc", "limit", "offset", "distinct",
  "true", "false", "case", "when", "then", "else", "end", "count", "sum", "avg",
  "min", "max", "nulls", "first", "last", "exists", "all", "any", "cast", "interval",
  "lower", "upper", "coalesce", "date", "extract", "round",
]);

const KEYWORD_PREFIX: Record<SimulatorStageType, RegExp> = {
  FROM: /^\s*FROM\s+/i,
  JOIN: /^\s*JOIN\s+/i,
  WHERE: /^\s*WHERE\s+/i,
  GROUP_BY: /^\s*GROUP\s+BY\s+/i,
  HAVING: /^\s*HAVING\s+/i,
  SELECT: /^\s*SELECT\s+/i,
  ORDER_BY: /^\s*ORDER\s+BY\s+/i,
  LIMIT: /^\s*LIMIT\s+/i,
};

export const STAGE_LABEL: Record<SimulatorStageType, string> = {
  FROM: "FROM",
  JOIN: "JOIN",
  WHERE: "WHERE",
  GROUP_BY: "GROUP BY",
  HAVING: "HAVING",
  SELECT: "SELECT",
  ORDER_BY: "ORDER BY",
  LIMIT: "LIMIT",
};

function squash(s: string): string {
  return s.replace(/\s+/g, " ").replace(/;\s*$/, "").trim();
}

/** Clause body (without its keyword) for a stage, e.g. "salary > 100000" for WHERE. */
export function extractStageExpression(
  sql: string,
  stage: SimulatorStageType,
  joinIndex = 0
): string {
  const range = getClauseRangeForStage(sql, stage, joinIndex);
  if (!range) return "";
  const text = sql.slice(range.from, range.to);
  if (stage === "JOIN") {
    // Keep the joined table and ON condition, e.g. "departments d ON e.department_id = d.id".
    return squash(text.replace(/^\s*(?:(?:LEFT|RIGHT|INNER|FULL|CROSS)\s+(?:OUTER\s+)?)?JOIN\s+/i, ""))
      .replace(/\s+(?:LEFT|RIGHT|INNER|FULL|CROSS)(?:\s+OUTER)?$/i, "");
  }
  return squash(text.replace(KEYWORD_PREFIX[stage], ""))
    .replace(/\s+(?:LEFT|RIGHT|INNER|FULL|CROSS)(?:\s+OUTER)?$/i, "");
}

/** Bare identifiers referenced by an expression (qualifiers stripped, lowercased). */
export function identifiersIn(expr: string): string[] {
  const withoutStrings = expr.replace(/'(?:[^']|'')*'/g, " ");
  const out: string[] = [];
  const re = /"?([A-Za-z_][\w$]*)"?(?:\s*\.\s*"?([A-Za-z_][\w$]*)"?)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(withoutStrings)) !== null) {
    const name = (m[2] ?? m[1]).toLowerCase();
    // Function calls are not column references.
    const after = withoutStrings.slice(re.lastIndex).trimStart();
    if (!m[2] && after.startsWith("(")) continue;
    if (SQL_WORDS.has(name)) continue;
    if (!out.includes(name)) out.push(name);
  }
  return out;
}

/** Map identifiers onto real column keys (case-insensitive, `table_col` suffix tolerant). */
export function matchColumns(identifiers: string[], columns: string[]): string[] {
  const out: string[] = [];
  for (const id of identifiers) {
    const exact = columns.find((c) => c.toLowerCase() === id);
    const suffix = exact ?? columns.find((c) => c.toLowerCase().endsWith(`_${id}`));
    const hit = exact ?? suffix;
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

function clauseOf(sql: string, stage: SimulatorStageType): string {
  const range = getClauseRangeForStage(sql, stage);
  if (!range) return "";
  return sql.slice(range.from, range.to).replace(KEYWORD_PREFIX[stage], "");
}

export function whereColumns(stageSql: string, columns: string[]): string[] {
  return matchColumns(identifiersIn(clauseOf(stageSql, "WHERE")), columns);
}

export function orderByColumns(stageSql: string, columns: string[]): string[] {
  const body = clauseOf(stageSql, "ORDER_BY").replace(/\b(ASC|DESC|NULLS\s+(FIRST|LAST))\b/gi, "");
  return matchColumns(identifiersIn(body), columns);
}

export function groupByColumns(stageSql: string, columns: string[]): string[] {
  return matchColumns(identifiersIn(clauseOf(stageSql, "GROUP_BY")), columns);
}

export type AggregateSpec = {
  fn: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
  /** Input column key in the pre-group rows, or "*" for COUNT(*). */
  inputColumn: string | null;
  /** Output column key in the grouped result, when it can be identified. */
  outputColumn: string | null;
  label: string;
};

/** Aggregate calls in a SELECT list, mapped to input and output columns. */
export function parseAggregates(
  stageSql: string,
  inputColumns: string[],
  outputColumns: string[]
): AggregateSpec[] {
  const selectList = clauseOf(stageSql, "SELECT");
  const re = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(DISTINCT\s+)?([^()]*?)\s*\)(?:\s+AS\s+"?([A-Za-z_][\w$]*)"?)?/gi;
  const out: AggregateSpec[] = [];
  const usedOutputs = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(selectList)) !== null) {
    const fn = m[1].toUpperCase() as AggregateSpec["fn"];
    const arg = m[3].trim();
    const alias = m[4]?.toLowerCase();
    const inputColumn = arg === "*" ? "*" : (matchColumns(identifiersIn(arg), inputColumns)[0] ?? null);
    const wanted = alias ?? fn.toLowerCase();
    const outputColumn =
      outputColumns.find((c) => c.toLowerCase() === wanted && !usedOutputs.has(c)) ?? null;
    if (outputColumn) usedOutputs.add(outputColumn);
    out.push({ fn, inputColumn, outputColumn, label: `${fn}(${arg})` });
  }
  return out;
}

/** HAVING references: aggregate output columns or plain grouped columns. */
export function havingColumns(stageSql: string, columns: string[]): string[] {
  const body = clauseOf(stageSql, "HAVING");
  const out = new Set<string>(matchColumns(identifiersIn(body), columns));
  const fnRe = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = fnRe.exec(body)) !== null) {
    const fn = m[1].toLowerCase();
    const col = columns.find((c) => c.toLowerCase() === fn);
    if (col) out.add(col);
  }
  return [...out];
}

export function limitValue(stageSql: string): number | null {
  const m = stageSql.match(/\bLIMIT\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}
