import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  generateSnapshots,
  SIMULATION_TOO_LARGE_MESSAGE,
  SIMULATOR_LIMITS,
} from "../snapshot/generateSnapshots";

describe("simulator workload limits", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE TABLE small_t (id INT, v INT);
      INSERT INTO small_t SELECT g, g % 3 FROM generate_series(1, 20) g;
      CREATE TABLE big_t (id INT);
      INSERT INTO big_t SELECT g FROM generate_series(1, ${SIMULATOR_LIMITS.maxRowsPerSnapshot + 1}) g;
    `);
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  it("still simulates normal queries", async () => {
    const result = await generateSnapshots({ sql: "SELECT id FROM small_t WHERE v = 1", db });
    expect(result.success).toBe(true);
  });

  it("refuses stages above the row limit with a run-normally hint", async () => {
    const result = await generateSnapshots({ sql: "SELECT id FROM big_t", db });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain(SIMULATION_TOO_LARGE_MESSAGE);
  });

  it("refuses oversized SQL text before parsing", async () => {
    const sql = `SELECT id FROM small_t -- ${"x".repeat(SIMULATOR_LIMITS.maxSqlChars)}`;
    const result = await generateSnapshots({ sql, db });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain(SIMULATION_TOO_LARGE_MESSAGE);
  });
});
