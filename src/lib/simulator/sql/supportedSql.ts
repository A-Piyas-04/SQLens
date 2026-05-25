import type { AST, Join, Select } from "node-sql-parser";

export type ValidationResult =
  | { supported: true }
  | { supported: false; reason: string };

const UNSUPPORTED_JOIN_TYPES = new Set([
  "RIGHT JOIN",
  "FULL JOIN",
  "FULL OUTER JOIN",
  "CROSS JOIN",
]);

export function validateSqlSupport(ast: AST): ValidationResult {
  if (ast.type !== "select") {
    return {
      supported: false,
      reason: "Only SELECT queries can currently be simulated.",
    };
  }

  const select = ast as Select;

  if (select.with && select.with.length > 0) {
    return {
      supported: false,
      reason: "CTE (WITH clause) simulation is not supported yet.",
    };
  }

  // UNION produces a linked chain via _next
  if (select._next) {
    return {
      supported: false,
      reason: "UNION simulation is not supported yet.",
    };
  }

  // Window functions (OVER clause)
  if (select.window) {
    return {
      supported: false,
      reason: "Window function simulation is not supported yet.",
    };
  }

  if (select.from) {
    // A bare TableExpr at the top level means a subquery is the sole source
    if (!Array.isArray(select.from)) {
      return {
        supported: false,
        reason: "Subquery simulation is not supported yet.",
      };
    }

    for (const item of select.from) {
      // Subquery in FROM (TableExpr has an `expr` property with nested ast)
      if ("expr" in item) {
        return {
          supported: false,
          reason: "Subquery simulation is not supported yet.",
        };
      }

      // Unsupported JOIN types
      if ("join" in item) {
        const joinType = (item as Join).join.toUpperCase();
        if (UNSUPPORTED_JOIN_TYPES.has(joinType)) {
          return {
            supported: false,
            reason: `${(item as Join).join} simulation is not supported yet.`,
          };
        }
      }
    }
  }

  return { supported: true };
}
