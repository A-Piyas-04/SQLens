import { describe, expect, it } from "vitest";
import type { TrackedRow } from "../../../../../lib/simulator";
import { selectRelevantColumns, identityColumn, MAX_FOCUS_COLUMNS } from "../relevantColumns";
import {
  extractStageExpression,
  groupByColumns,
  havingColumns,
  identifiersIn,
  limitValue,
  orderByColumns,
  parseAggregates,
  whereColumns,
} from "../stageSqlParts";
import { buildGroupModel, formatValue } from "../groupModel";
import { FOCUS_ROW_LIMIT, otherRowsLabel, windowRows } from "../rowWindow";

function wideRows(): TrackedRow[] {
  return [
    { _rowId: "r1", id: 1, full_name: "Alice", email: "a@x", phone: "1", city: "A", department_id: 1, salary: 145000, hired_at: "2019" },
    { _rowId: "r2", id: 2, full_name: "Bob", email: "b@x", phone: "2", city: "B", department_id: 1, salary: 132000, hired_at: "2020" },
    { _rowId: "r3", id: 3, full_name: "Carla", email: "c@x", phone: "3", city: "C", department_id: 2, salary: 118000, hired_at: "2021" },
  ];
}

describe("stageSqlParts", () => {
  it("extracts the clause body for the operation bar", () => {
    const sql = "SELECT name FROM employees WHERE salary > 100000 ORDER BY salary DESC LIMIT 5";
    expect(extractStageExpression(sql, "WHERE")).toBe("salary > 100000");
    expect(extractStageExpression(sql, "ORDER_BY")).toBe("salary DESC");
    expect(extractStageExpression(sql, "LIMIT")).toBe("5");
    expect(extractStageExpression(sql, "SELECT")).toBe("name");
  });

  it("extracts the JOIN target and ON condition", () => {
    const sql = "SELECT * FROM employees e INNER JOIN departments d ON e.department_id = d.id";
    expect(extractStageExpression(sql, "JOIN")).toBe("departments d ON e.department_id = d.id");
  });

  it("identifiersIn strips qualifiers, strings, keywords and function names", () => {
    expect(identifiersIn("e.salary > 10 AND lower(name) = 'bob smith'")).toEqual(["salary", "name"]);
  });

  it("maps WHERE / ORDER BY / GROUP BY / HAVING columns", () => {
    const cols = ["id", "full_name", "department_id", "salary", "avg"];
    expect(whereColumns("SELECT * FROM t WHERE salary > 5", cols)).toEqual(["salary"]);
    expect(orderByColumns("SELECT * FROM t ORDER BY salary DESC, id", cols)).toEqual(["salary", "id"]);
    expect(groupByColumns("SELECT department_id FROM t GROUP BY department_id", cols)).toEqual(["department_id"]);
    expect(havingColumns("SELECT department_id, AVG(salary) FROM t GROUP BY department_id HAVING AVG(salary) > 1", cols)).toEqual(
      expect.arrayContaining(["avg"])
    );
  });

  it("parses aggregates to input and output columns", () => {
    const specs = parseAggregates(
      "SELECT department_id, AVG(salary), COUNT(*) AS headcount FROM t GROUP BY department_id",
      ["department_id", "salary"],
      ["department_id", "avg", "headcount"]
    );
    expect(specs).toEqual([
      { fn: "AVG", inputColumn: "salary", outputColumn: "avg", label: "AVG(salary)" },
      { fn: "COUNT", inputColumn: "*", outputColumn: "headcount", label: "COUNT(*)" },
    ]);
  });

  it("reads LIMIT", () => {
    expect(limitValue("SELECT * FROM t LIMIT 3")).toBe(3);
    expect(limitValue("SELECT * FROM t")).toBeNull();
  });
});

describe("selectRelevantColumns", () => {
  it("shows all columns when the source is narrow", () => {
    const rows: TrackedRow[] = [{ _rowId: "a", id: 1, name: "x", salary: 1 }];
    const r = selectRelevantColumns({ stageType: "WHERE", stageSql: "SELECT * FROM t WHERE salary > 0", prevRows: rows, targetRows: rows });
    expect(r.focus).toEqual(["id", "name", "salary"]);
    expect(r.emphasis).toEqual(["salary"]);
    expect(r.hiddenCount).toBe(0);
  });

  it("WHERE on a wide table keeps predicate + identity, drops irrelevant columns", () => {
    const rows = wideRows();
    const r = selectRelevantColumns({ stageType: "WHERE", stageSql: "SELECT * FROM e WHERE salary > 120000", prevRows: rows, targetRows: rows.slice(0, 2) });
    expect(r.focus).toContain("salary");
    expect(r.focus).toContain("full_name");
    expect(r.focus.length).toBeLessThanOrEqual(MAX_FOCUS_COLUMNS);
    expect(r.hiddenCount).toBeGreaterThan(0);
  });

  it("ORDER BY includes the sort columns", () => {
    const rows = wideRows();
    const r = selectRelevantColumns({ stageType: "ORDER_BY", stageSql: "SELECT * FROM e ORDER BY hired_at DESC", prevRows: rows, targetRows: rows });
    expect(r.emphasis).toEqual(["hired_at"]);
    expect(r.focus).toContain("hired_at");
  });

  it("GROUP BY shows only group keys, aggregate inputs and an identifying column", () => {
    const rows = wideRows();
    const target: TrackedRow[] = [
      { _rowId: "g1", department_id: 1, avg: 138500 },
      { _rowId: "g2", department_id: 2, avg: 118000 },
    ];
    const r = selectRelevantColumns({
      stageType: "GROUP_BY",
      stageSql: "SELECT department_id, AVG(salary) FROM e GROUP BY department_id",
      prevRows: rows,
      targetRows: target,
    });
    expect(r.emphasis).toEqual(["department_id", "salary"]);
    expect(r.focus).toEqual(["full_name", "department_id", "salary"]);
    expect(r.focus).not.toContain("email");
  });

  it("JOIN emphasises the join keys", () => {
    const target: TrackedRow[] = [
      { _rowId: "j1", e_id: 1, e_full_name: "A", e_department_id: 1, d_id: 1, d_name: "Eng", x1: 1, x2: 2, x3: 3 },
    ];
    const r = selectRelevantColumns({
      stageType: "JOIN",
      stageSql: "",
      prevRows: [],
      targetRows: target,
      joinKeys: { left: "e_department_id", right: "d_id" },
    });
    expect(r.emphasis).toEqual(["e_department_id", "d_id"]);
    expect(r.focus).toEqual(expect.arrayContaining(["e_department_id", "d_id"]));
  });

  it("SELECT emphasises kept columns and shows some dropped ones", () => {
    const rows = wideRows();
    const target: TrackedRow[] = rows.map((r) => ({ _rowId: r._rowId, full_name: r.full_name, salary: r.salary }));
    const r = selectRelevantColumns({ stageType: "SELECT", stageSql: "SELECT full_name, salary FROM e", prevRows: rows, targetRows: target });
    expect(r.emphasis).toEqual(["full_name", "salary"]);
    expect(r.focus.length).toBeLessThanOrEqual(MAX_FOCUS_COLUMNS);
  });

  it("identityColumn prefers name-like columns", () => {
    const rows = wideRows();
    expect(identityColumn(rows, ["id", "email", "full_name"])).toBe("full_name");
  });
});

describe("buildGroupModel", () => {
  it("partitions rows and maps aggregates from the snapshot", () => {
    const prev = wideRows();
    const target: TrackedRow[] = [
      { _rowId: "g1", department_id: 1, avg: "138500.00" },
      { _rowId: "g2", department_id: 2, avg: "118000.00" },
    ];
    const m = buildGroupModel(prev, target, "SELECT department_id, AVG(salary) FROM e GROUP BY department_id");
    expect(m.keyColumns).toEqual(["department_id"]);
    expect(m.groups).toHaveLength(2);
    expect(m.groups[0].memberIds).toEqual(["r1", "r2"]);
    expect(m.groups[0].targetRowId).toBe("g1");
    expect(m.groups[0].aggregates[0].expression).toBe("(145,000 + 132,000) ÷ 2");
    expect(m.groups[0].aggregates[0].result).toBe("138,500");
    expect(m.groupIndexByRowId.get("g2")).toBe(1);
  });

  it("falls back to a heuristic key when GROUP BY can't be parsed", () => {
    const prev = wideRows();
    const target: TrackedRow[] = [
      { _rowId: "g1", department_id: 1 },
      { _rowId: "g2", department_id: 2 },
    ];
    const m = buildGroupModel(prev, target, "");
    expect(m.groups).toHaveLength(2);
  });

  it("formatValue renders NULL and thousands separators", () => {
    expect(formatValue(null)).toBe("NULL");
    expect(formatValue(1234567)).toBe("1,234,567");
    expect(formatValue("abc")).toBe("abc");
  });
});

describe("rowWindow", () => {
  it("keeps all rows under the limit", () => {
    const rows = wideRows();
    const w = windowRows(rows, new Set(), FOCUS_ROW_LIMIT);
    expect(w.rows).toHaveLength(3);
    expect(w.hiddenCount).toBe(0);
  });

  it("windows around important rows and reports the remainder", () => {
    const rows: TrackedRow[] = Array.from({ length: 40 }, (_, i) => ({ _rowId: `r${i}`, v: i }));
    const w = windowRows(rows, new Set(["r30"]), FOCUS_ROW_LIMIT);
    expect(w.rows.length).toBeLessThanOrEqual(FOCUS_ROW_LIMIT);
    expect(w.rows.map((r) => r._rowId)).toContain("r30");
    expect(w.hiddenCount).toBe(40 - w.rows.length);
    expect(otherRowsLabel(w.hiddenCount)).toMatch(/other rows?/);
  });
});
