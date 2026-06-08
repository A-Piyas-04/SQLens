import { describe, expect, it } from "vitest";

import { splitSqlStatements } from "../splitSqlStatements";

describe("splitSqlStatements", () => {
  it("returns a single statement when no semicolon is present", () => {
    expect(splitSqlStatements("SELECT 1")).toEqual(["SELECT 1"]);
  });

  it("splits multiple statements on semicolons", () => {
    expect(
      splitSqlStatements("CREATE TABLE t (id INT); INSERT INTO t VALUES (1); SELECT * FROM t;")
    ).toEqual([
      "CREATE TABLE t (id INT)",
      "INSERT INTO t VALUES (1)",
      "SELECT * FROM t",
    ]);
  });

  it("ignores semicolons inside single-quoted strings", () => {
    expect(
      splitSqlStatements("INSERT INTO t VALUES ('a;b'); SELECT 1;")
    ).toEqual(["INSERT INTO t VALUES ('a;b')", "SELECT 1"]);
  });

  it("ignores semicolons inside double-quoted identifiers", () => {
    expect(splitSqlStatements('SELECT "a;b" FROM t; SELECT 2;')).toEqual([
      'SELECT "a;b" FROM t',
      "SELECT 2",
    ]);
  });

  it("ignores semicolons inside line and block comments", () => {
    const statements = splitSqlStatements(`
        -- trailing; comment
        SELECT 1; /* block; comment */ SELECT 2;
      `);

    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain("SELECT 1");
    expect(statements[1]).toContain("SELECT 2");
  });

  it("returns an empty array for blank input", () => {
    expect(splitSqlStatements("   \n  -- only comments\n  ")).toEqual([]);
  });
});
