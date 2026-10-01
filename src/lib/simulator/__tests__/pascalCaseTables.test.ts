import { Parser } from "node-sql-parser";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

import { buildStageSql } from "../sql/buildStageSql";
import type { Select } from "node-sql-parser";

describe("PascalCase table names (SQL50 LeetCode style)", () => {
  const parser = new Parser();
  const userSql = `SELECT product_id
FROM Products
WHERE low_fats = 'Y' AND recyclable = 'Y';`;

  it("FROM stage SQL executes against schema created with CREATE TABLE Products", async () => {
    const parsed = parser.astify(userSql, { database: "PostgreSQL" });
    const select = (Array.isArray(parsed) ? parsed[0] : parsed) as Select;

    const stage = buildStageSql(select, "FROM");
    expect(stage.ok).toBe(true);
    if (!stage.ok) return;

    const db = new PGlite();
    await db.exec(`
      CREATE TABLE Products (
        product_id INT PRIMARY KEY,
        low_fats VARCHAR(1) NOT NULL,
        recyclable VARCHAR(1) NOT NULL
      );
      INSERT INTO Products VALUES (0,'Y','N'), (1,'Y','Y'), (2,'N','Y'), (3,'Y','Y');
    `);

    const direct = await db.query(userSql);
    expect(direct.rows).toHaveLength(2);

    await expect(db.query(stage.sql)).resolves.toBeDefined();
    const stageResult = await db.query(stage.sql);
    expect(stageResult.rows.length).toBeGreaterThan(0);
  }, 60_000);
});
