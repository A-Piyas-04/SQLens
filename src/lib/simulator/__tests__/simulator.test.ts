import { describe, it, expect } from "vitest";
import { Parser } from "node-sql-parser";

import { buildStageSql, selectHasJoin } from "../sql/buildStageSql";
import { assignRowIds } from "../snapshot/assignRowIds";
import { diffSnapshots } from "../snapshot/diffSnapshots";
import { buildPipeline } from "../pipeline/buildPipeline";
import { validateSqlSupport } from "../sql/supportedSql";
import type { Select } from "node-sql-parser";
import type { SimulatorSnapshot, TrackedRow } from "../types/snapshotTypes";

// ── Helpers ──────────────────────────────────────────────────────────────────

const parser = new Parser();

function parse(sql: string): Select {
  const result = parser.astify(sql.trim(), { database: "PostgreSQL" });
  const ast = Array.isArray(result) ? result[0] : result;
  if (!ast || ast.type !== "select") throw new Error("Not a SELECT");
  return ast as Select;
}

function makeSnapshot(
  stageId: string,
  rows: TrackedRow[]
): SimulatorSnapshot {
  return {
    stageId,
    stageType: "FROM",
    label: stageId,
    sql: "",
    rows,
    rowCount: rows.length,
    annotation: "",
  };
}

// ── buildStageSql ────────────────────────────────────────────────────────────

describe("buildStageSql", () => {
  describe("simple single-table query", () => {
    const select = parse(
      "SELECT name, gpa FROM students WHERE gpa > 3.5 ORDER BY gpa DESC LIMIT 2"
    );

    it("FROM: produces SELECT * without WHERE, ORDER BY, LIMIT", () => {
      const r = buildStageSql(select, "FROM");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.sql).toMatch(/SELECT\s+\*/i);
      expect(r.sql).not.toMatch(/WHERE/i);
      expect(r.sql).not.toMatch(/ORDER BY/i);
      expect(r.sql).not.toMatch(/LIMIT/i);
    });

    it("WHERE: produces SELECT * with WHERE, without ORDER BY / LIMIT", () => {
      const r = buildStageSql(select, "WHERE");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.sql).toMatch(/SELECT\s+\*/i);
      expect(r.sql).toMatch(/WHERE/i);
      expect(r.sql).not.toMatch(/ORDER BY/i);
      expect(r.sql).not.toMatch(/LIMIT/i);
    });

    it("SELECT: produces projected columns with WHERE, without ORDER BY / LIMIT", () => {
      const r = buildStageSql(select, "SELECT");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.sql).toMatch(/name/i);
      expect(r.sql).toMatch(/gpa/i);
      expect(r.sql).toMatch(/WHERE/i);
      expect(r.sql).not.toMatch(/ORDER BY/i);
      expect(r.sql).not.toMatch(/LIMIT/i);
    });

    it("ORDER_BY: produces columns with WHERE and ORDER BY, without LIMIT", () => {
      const r = buildStageSql(select, "ORDER_BY");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.sql).toMatch(/ORDER BY/i);
      expect(r.sql).not.toMatch(/LIMIT/i);
    });

    it("LIMIT: produces full SQL with appended LIMIT clause", () => {
      const r = buildStageSql(select, "LIMIT");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.sql).toMatch(/LIMIT\s+2/i);
    });
  });

  describe("JOIN query", () => {
    const select = parse(
      "SELECT s.name, d.name FROM students s INNER JOIN departments d ON s.department_id = d.id WHERE s.gpa > 3.0"
    );

    it("FROM: strips JOIN items — only base table", () => {
      const r = buildStageSql(select, "FROM");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      // node-sql-parser may quote identifiers or include aliases — check
      // that the base table appears and the join table does NOT.
      expect(r.sql).toMatch(/students/i);
      expect(r.sql).not.toMatch(/JOIN/i);
      expect(r.sql).not.toMatch(/departments/i);
    });

    it("JOIN: includes all FROM items (base + join table + ON)", () => {
      const r = buildStageSql(select, "JOIN");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.sql).toMatch(/JOIN/i);
      expect(r.sql).toMatch(/departments/i);
      expect(r.sql).not.toMatch(/WHERE/i);
      expect(r.sql).not.toMatch(/LIMIT/i);
    });

    it("selectHasJoin returns true for JOIN query", () => {
      expect(selectHasJoin(select)).toBe(true);
    });
  });

  describe("GROUP BY / HAVING query", () => {
    const select = parse(
      "SELECT department_id, COUNT(*) AS cnt FROM students GROUP BY department_id HAVING COUNT(*) > 1 ORDER BY cnt DESC"
    );

    it("GROUP_BY: keeps GROUP BY, removes HAVING / ORDER BY / LIMIT", () => {
      const r = buildStageSql(select, "GROUP_BY");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.sql).toMatch(/GROUP BY/i);
      expect(r.sql).not.toMatch(/HAVING/i);
      expect(r.sql).not.toMatch(/ORDER BY/i);
    });

    it("HAVING: keeps GROUP BY and HAVING, removes ORDER BY / LIMIT", () => {
      const r = buildStageSql(select, "HAVING");
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.sql).toMatch(/GROUP BY/i);
      expect(r.sql).toMatch(/HAVING/i);
      expect(r.sql).not.toMatch(/ORDER BY/i);
    });
  });
});

// ── buildPipeline ────────────────────────────────────────────────────────────

describe("buildPipeline", () => {
  it("simple FROM + WHERE + SELECT pipeline", () => {
    // Use a non-integer in the predicate — node-sql-parser sometimes emits a
    // spurious empty LIMIT when the integer `3` trails a WHERE clause.
    const ast = parse("SELECT name FROM students WHERE gpa > 3.5");
    const { stages } = buildPipeline(ast, "");
    expect(stages.map((s) => s.type)).toEqual(["FROM", "WHERE", "SELECT"]);
  });

  it("JOIN pipeline includes JOIN stage", () => {
    const ast = parse(
      "SELECT s.name FROM students s INNER JOIN departments d ON s.department_id = d.id WHERE s.gpa > 3.5"
    );
    const { stages } = buildPipeline(ast, "");
    expect(stages.map((s) => s.type)).toEqual(["FROM", "JOIN", "WHERE", "SELECT"]);
  });

  it("full pipeline with all clauses", () => {
    const ast = parse(
      "SELECT name FROM students WHERE gpa > 3 ORDER BY name LIMIT 5"
    );
    const { stages } = buildPipeline(ast, "");
    expect(stages.map((s) => s.type)).toEqual([
      "FROM",
      "WHERE",
      "SELECT",
      "ORDER_BY",
      "LIMIT",
    ]);
  });

  it("GROUP BY + HAVING pipeline", () => {
    const ast = parse(
      "SELECT department_id, COUNT(*) FROM students GROUP BY department_id HAVING COUNT(*) > 1.0"
    );
    const { stages } = buildPipeline(ast, "");
    expect(stages.map((s) => s.type)).toEqual([
      "FROM",
      "GROUP_BY",
      "HAVING",
      "SELECT",
    ]);
  });
});

// ── validateSqlSupport ────────────────────────────────────────────────────────

describe("validateSqlSupport", () => {
  it("allows simple SELECT", () => {
    const ast = parse("SELECT * FROM students");
    expect(validateSqlSupport(ast).supported).toBe(true);
  });

  it("allows INNER JOIN", () => {
    const ast = parse(
      "SELECT * FROM students INNER JOIN departments ON students.department_id = departments.id"
    );
    expect(validateSqlSupport(ast).supported).toBe(true);
  });

  it("allows LEFT JOIN", () => {
    const ast = parse(
      "SELECT * FROM courses LEFT JOIN enrollments ON courses.id = enrollments.course_id"
    );
    expect(validateSqlSupport(ast).supported).toBe(true);
  });

  it("allows GROUP BY", () => {
    const ast = parse(
      "SELECT department_id, COUNT(*) FROM students GROUP BY department_id"
    );
    expect(validateSqlSupport(ast).supported).toBe(true);
  });

  it("allows HAVING", () => {
    const ast = parse(
      "SELECT department_id, COUNT(*) FROM students GROUP BY department_id HAVING COUNT(*) > 1"
    );
    expect(validateSqlSupport(ast).supported).toBe(true);
  });

  it("rejects RIGHT JOIN", () => {
    // CROSS JOIN is mis-parsed by node-sql-parser (treats CROSS as a table
    // alias), so we test RIGHT JOIN which parses correctly.
    const ast = parse(
      "SELECT * FROM students RIGHT JOIN departments ON students.department_id = departments.id"
    );
    const r = validateSqlSupport(ast);
    expect(r.supported).toBe(false);
  });

  it("rejects UNION", () => {
    const ast = parse(
      "SELECT name FROM students UNION SELECT name FROM departments"
    );
    const r = validateSqlSupport(ast);
    expect(r.supported).toBe(false);
  });
});

// ── assignRowIds ─────────────────────────────────────────────────────────────

describe("assignRowIds", () => {
  const baseRows = [
    { id: 1, name: "Alice", gpa: 3.9 },
    { id: 2, name: "Bob", gpa: 3.4 },
    { id: 3, name: "Carla", gpa: 3.5 },
  ];

  it("FROM stage: assigns sequential IDs", () => {
    const tracked = assignRowIds(baseRows, null);
    expect(tracked.map((r) => r._rowId)).toEqual(["row-0", "row-1", "row-2"]);
  });

  it("a second expansion never reuses a row-new id from an earlier one", () => {
    const prev = [
      { _rowId: "row-0", k: 1 },
      { _rowId: "row-new-0", k: 1 },
      { _rowId: "row-new-1", k: 2 },
    ];
    const current = [{ k: 1 }, { k: 1 }, { k: 1 }, { k: 2 }, { k: 2 }];
    const ids = assignRowIds(current, prev).map((r) => r._rowId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(0, 2)).toEqual(["row-0", "row-new-0"]);
  });

  it("WHERE stage: preserves IDs for matching rows", () => {
    const prev = assignRowIds(baseRows, null);
    const filtered = [baseRows[0], baseRows[2]]; // Alice and Carla
    const tracked = assignRowIds(filtered, prev);
    expect(tracked.map((r) => r._rowId)).toEqual(["row-0", "row-2"]);
  });

  it("ORDER_BY stage: preserves IDs after reorder", () => {
    const prev = assignRowIds(baseRows, null);
    const reordered = [baseRows[1], baseRows[2], baseRows[0]]; // Bob, Carla, Alice
    const tracked = assignRowIds(reordered, prev);
    expect(tracked.map((r) => r._rowId)).toEqual(["row-1", "row-2", "row-0"]);
  });

  it("SELECT stage: preserves IDs when columns are projected away", () => {
    const prev = assignRowIds(baseRows, null);
    const projected = baseRows.map(({ name }) => ({ name }));
    const tracked = assignRowIds(projected, prev);
    expect(tracked.map((r) => r._rowId)).toEqual(["row-0", "row-1", "row-2"]);
  });

  it("assigns new IDs to rows with no match in prev", () => {
    const prev = assignRowIds([{ id: 1, name: "Alice" }], null);
    const newRows = [
      { id: 1, name: "Alice" },
      { id: 99, name: "Stranger" },
    ];
    const tracked = assignRowIds(newRows, prev);
    expect(tracked[0]._rowId).toBe("row-0");
    expect(tracked[1]._rowId).toBe("row-new-0");
  });
});

// ── diffSnapshots ─────────────────────────────────────────────────────────────

describe("diffSnapshots", () => {
  const makeTracked = (rows: Record<string, unknown>[]): TrackedRow[] =>
    rows.map((r, i) => ({ ...r, _rowId: `row-${i}` }));

  it("detects removed rows (WHERE filter)", () => {
    const prev = makeSnapshot("from", makeTracked([
      { id: 1, gpa: 3.9 },
      { id: 2, gpa: 3.0 },
    ]));
    const curr = {
      ...makeSnapshot("where", [prev.rows[0]]),
      stageType: "WHERE" as const,
    };

    const diff = diffSnapshots(prev, curr);
    const removed = diff.rowDiffs.filter((d) => d.status === "removed");
    expect(removed).toHaveLength(1);
    expect(removed[0].rowId).toBe("row-1");
    expect(removed[0].reason).toMatch(/WHERE/i);
  });

  it("detects added rows (JOIN expansion)", () => {
    const prev = makeSnapshot("from", makeTracked([{ id: 1 }]));
    const curr = {
      ...makeSnapshot("join", [
        { ...prev.rows[0] },
        { id: 1, _rowId: "row-new-0" },
      ]),
      stageType: "JOIN" as const,
    };

    const diff = diffSnapshots(prev, curr);
    const added = diff.rowDiffs.filter((d) => d.status === "added");
    expect(added).toHaveLength(1);
    expect(added[0].reason).toMatch(/matched/i);
  });

  it("detects reordered rows (ORDER BY)", () => {
    const rows = makeTracked([{ id: 1 }, { id: 2 }]);
    const prev = makeSnapshot("select", rows);
    const curr = makeSnapshot("order_by", [rows[1], rows[0]]);

    const diff = diffSnapshots(prev, curr);
    const reordered = diff.rowDiffs.filter((d) => d.status === "reordered");
    // Swapping two rows is one move relative to the other survivor.
    expect(reordered).toHaveLength(1);
  });

  it("removing a row does not mark following survivors reordered", () => {
    const rows = makeTracked([{ v: "A" }, { v: "B" }, { v: "C" }, { v: "D" }]);
    const prev = makeSnapshot("from", rows);
    const curr = { ...makeSnapshot("where", [rows[0], rows[2], rows[3]]), stageType: "WHERE" as const };

    const diff = diffSnapshots(prev, curr);
    expect(diff.rowDiffs.filter((d) => d.status === "reordered")).toHaveLength(0);
    expect(diff.rowDiffs.find((d) => d.rowId === "row-2")?.status).toBe("unchanged");
    expect(diff.rowDiffs.find((d) => d.rowId === "row-3")?.status).toBe("unchanged");
  });

  it("detects the actual mover in A C B D", () => {
    const rows = makeTracked([{ v: "A" }, { v: "B" }, { v: "C" }, { v: "D" }]);
    const prev = makeSnapshot("select", rows);
    const curr = makeSnapshot("order_by", [rows[0], rows[2], rows[1], rows[3]]);

    const diff = diffSnapshots(prev, curr);
    const movers = diff.rowDiffs.filter((d) => d.status === "reordered").map((d) => d.rowId);
    expect(movers).toHaveLength(1);
    expect(["row-1", "row-2"]).toContain(movers[0]);
    expect(diff.rowDiffs.find((d) => d.rowId === "row-0")?.status).toBe("unchanged");
    expect(diff.rowDiffs.find((d) => d.rowId === "row-3")?.status).toBe("unchanged");
  });

  it("full reversal marks all but one row reordered", () => {
    const rows = makeTracked([{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }]);
    const prev = makeSnapshot("select", rows);
    const curr = makeSnapshot("order_by", [...rows].reverse());
    const diff = diffSnapshots(prev, curr);
    expect(diff.rowDiffs.filter((d) => d.status === "reordered")).toHaveLength(3);
  });

  it("detects null-introduced columns (LEFT JOIN)", () => {
    const prev = makeSnapshot("join", makeTracked([
      { student_id: 1, course_id: 10, grade: "A" },
    ]));
    const curr = makeSnapshot("join2", [
      { ...prev.rows[0], grade: null },
    ]);

    const diff = diffSnapshots(prev, curr);
    const nullRows = diff.rowDiffs.filter((d) => d.status === "null-introduced");
    expect(nullRows).toHaveLength(1);
    expect(nullRows[0].nullColumns).toContain("grade");
  });

  it("detects hidden columns (SELECT projection)", () => {
    const prev = makeSnapshot("where", makeTracked([
      { id: 1, name: "Alice", gpa: 3.9 },
    ]));
    const curr = makeSnapshot("select", [
      { name: "Alice", _rowId: "row-0" },
    ]);

    const diff = diffSnapshots(prev, curr);
    const hidden = diff.columnDiffs.filter((c) => c.status === "hidden");
    expect(hidden.map((c) => c.column)).toEqual(
      expect.arrayContaining(["id", "gpa"])
    );
  });

  it("LIMIT removed reason includes row count", () => {
    const rows = makeTracked([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const prev = makeSnapshot("order_by", rows);
    const curr = {
      ...makeSnapshot("limit", [rows[0], rows[1]]),
      stageType: "LIMIT" as const,
      rowCount: 2,
    };

    const diff = diffSnapshots(prev, curr);
    const removed = diff.rowDiffs.find((d) => d.status === "removed");
    expect(removed?.reason).toMatch(/LIMIT 2/i);
  });
});
