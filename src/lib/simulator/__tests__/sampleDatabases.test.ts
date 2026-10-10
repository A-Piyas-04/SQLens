import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

import { SAMPLE_DATABASES } from "../../../data/sampleDatabases";
import { VISUALIZATION_PRESETS } from "../../../data/visualizationPresets";
import { generateSnapshots } from "../snapshot/generateSnapshots";

async function loadSample(sql: string): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(sql);
  return db;
}

describe("sample databases", () => {
  for (const sample of SAMPLE_DATABASES) {
    it(`${sample.name}: starter query simulates every stage`, async () => {
      const db = await loadSample(sample.sql);
      try {
        const result = await generateSnapshots({ sql: sample.starterQuery!, db });
        if (!result.success) throw new Error(result.error);

        const stages = result.snapshots.map((s) => s.stageType);
        expect(stages).toEqual(
          expect.arrayContaining(["JOIN", "WHERE", "GROUP_BY", "HAVING", "ORDER_BY", "LIMIT"])
        );

        const counts = result.snapshots.map((s) => s.rowCount);

        const byType = (t: string) =>
          result.snapshots.filter((s) => s.stageType === t).at(-1)!.rowCount;
        expect(counts.every((c) => c > 0)).toBe(true);
        expect(byType("WHERE")).toBeLessThan(
          result.snapshots.filter((s) => s.stageType === "JOIN").at(-1)!.rowCount
        );
        expect(byType("HAVING")).toBeLessThan(byType("GROUP_BY"));
        expect(byType("LIMIT")).toBeLessThan(byType("ORDER_BY"));
      } finally {
        await db.close();
      }
    }, 60_000);
  }

  for (const preset of VISUALIZATION_PRESETS) {
    it(`preset ${preset.id} still simulates`, async () => {
      const sample = SAMPLE_DATABASES.find((s) => s.id === preset.databaseId)!;
      const db = await loadSample(sample.sql);
      try {
        const result = await generateSnapshots({ sql: preset.sql, db });
        if (!result.success) throw new Error(result.error);
        expect(result.snapshots.at(-1)!.rowCount).toBeGreaterThan(0);
      } finally {
        await db.close();
      }
    }, 60_000);
  }
});
