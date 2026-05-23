import type { PGlite } from "@electric-sql/pglite";
import type { Select } from "node-sql-parser";

import { runQuery } from "../db/query";
import { parseSql } from "./parseSql";
import { validateSqlSupport } from "./supportedSql";
import { buildPipeline } from "./buildPipeline";
import { buildStageSql } from "./buildStageSql";
import type { SimulatorStageType } from "./simulatorTypes";
import type { SimulatorSnapshot, SnapshotResult } from "./snapshotTypes";

type GenerateSnapshotsInput = {
  sql: string;
  db: PGlite;
};

const STAGE_ANNOTATIONS: Record<
  SimulatorStageType,
  (tableName: string) => string
> = {
  FROM: (t) => `Loaded all rows from "${t}".`,
  JOIN: () => "Joined rows based on the ON condition.",
  WHERE: () => "Filtered rows using the WHERE condition.",
  SELECT: () => "Projected only the selected columns.",
  ORDER_BY: () => "Sorted the result set by the specified columns.",
  LIMIT: () => "Limited the result set to the specified row count.",
};

function getBaseTableName(select: Select): string {
  const froms = Array.isArray(select.from) ? select.from : [];
  const first = froms[0];
  if (first && "table" in first && first.table) {
    return String(first.table);
  }
  return "table";
}

export async function generateSnapshots({
  sql,
  db,
}: GenerateSnapshotsInput): Promise<SnapshotResult> {
  const parseResult = parseSql(sql);
  if (!parseResult.ok) {
    return { success: false, error: parseResult.error };
  }

  const validation = validateSqlSupport(parseResult.ast);
  if (!validation.supported) {
    return { success: false, error: validation.reason };
  }

  if (parseResult.ast.type !== "select") {
    return {
      success: false,
      error: "Only SELECT queries can be simulated.",
    };
  }

  const select = parseResult.ast as Select;
  const pipeline = buildPipeline(parseResult.ast, sql);
  const tableName = getBaseTableName(select);
  const snapshots: SimulatorSnapshot[] = [];

  for (const stage of pipeline.stages) {
    const stageSqlResult = buildStageSql(select, stage.type);

    if (!stageSqlResult.ok) {
      return { success: false, error: stageSqlResult.reason };
    }

    const queryResult = await runQuery(db, stageSqlResult.sql);

    if (!queryResult.success) {
      return {
        success: false,
        error: `Stage "${stage.label}" failed: ${queryResult.error ?? "Unknown error"}`,
      };
    }

    snapshots.push({
      stageId: stage.id,
      stageType: stage.type,
      label: stage.label,
      sql: stageSqlResult.sql,
      rows: queryResult.rows,
      rowCount: queryResult.rows.length,
      annotation: STAGE_ANNOTATIONS[stage.type](tableName),
    });
  }

  return { success: true, snapshots };
}
