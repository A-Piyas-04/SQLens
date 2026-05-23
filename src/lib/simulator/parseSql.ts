import { Parser, type AST } from "node-sql-parser";

let _parser: Parser | null = null;

function getParser(): Parser {
  if (!_parser) {
    _parser = new Parser();
  }
  return _parser;
}

export type ParseResult =
  | { ok: true; ast: AST }
  | { ok: false; error: string };

export function parseSql(sql: string): ParseResult {
  const trimmed = sql.trim();
  if (!trimmed) {
    return { ok: false, error: "Query is empty." };
  }

  try {
    const parser = getParser();
    const result = parser.astify(trimmed, { database: "PostgreSQL" });
    const ast = Array.isArray(result) ? result[0] : result;
    if (!ast) {
      return { ok: false, error: "Could not parse SQL query." };
    }
    return { ok: true, ast };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // node-sql-parser error messages are verbose — trim to first line
    const message = raw.split("\n")[0] ?? raw;
    return { ok: false, error: `Parse error: ${message}` };
  }
}
