import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runQuery } from "../query";

describe("runQuery", () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await db.waitReady;
  });

  afterEach(async () => {
    await db.close();
  });

  it("executes multiple statements and returns rows from the last one", async () => {
    const result = await runQuery(
      db,
      `CREATE TABLE students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50)
      );
      INSERT INTO students (name) VALUES ('Alice');
      SELECT * FROM students;`
    );

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.message).toBe("3 statements executed. 1 row(s) returned.");
  });

  it("stops at the first failing statement", async () => {
    const result = await runQuery(
      db,
      "SELECT 1; SELECT * FROM missing_table;"
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Statement 2 of 2:/);
  });
});
