import type { PGlite } from "@electric-sql/pglite";
import type { Select } from "node-sql-parser";

import { runQuery } from "../../db/query";
import { parseSql } from "../sql/parseSql";
import { validateSqlSupport } from "../sql/supportedSql";
import { buildPipeline } from "../pipeline/buildPipeline";
import { buildStageSql, buildRightTableSql, selectHasJoin } from "../sql/buildStageSql";
import { assignRowIds } from "./assignRowIds";
import { diffSnapshots } from "./diffSnapshots";
import type { SimulatorStageType } from "../types/simulatorTypes";
import type {
  SimulatorSnapshot,
  StageDiff,
  SnapshotResult,
  TrackedRow,
} from "../types/snapshotTypes";

type GenerateSnapshotsInput = {
  sql: string;
  db: PGlite;
};

// ── Annotation builders ──────────────────────────────────────────────────────

function buildAnnotation(
  stageType: SimulatorStageType,
  tableName: string,
  hasJoin: boolean,
  joinType: string,
  snapshot?: SimulatorSnapshot,
  prevSnapshot?: SimulatorSnapshot
): string {
  switch (stageType) {
    case "FROM":
      return hasJoin
        ? `Loaded all rows from "${tableName}" (base table — before JOINs).`
        : `Loaded all rows from "${tableName}".`;
    case "JOIN": {
      const prevCount = prevSnapshot?.rowCount ?? 0;
      const currCount = snapshot?.rowCount ?? 0;
      return (
        `Applied ${joinType} — combined ${prevCount} row${prevCount !== 1 ? "s" : ""} ` +
        `with the joined table. Intermediate result: ${currCount} row${currCount !== 1 ? "s" : ""}.`
      );
    }
    case "WHERE":
      return "Filtered rows using the WHERE condition.";
    case "GROUP_BY": {
      const groupCount = snapshot?.rowCount ?? 0;
      const prevCount = prevSnapshot?.rowCount ?? 0;
      return `Grouped ${prevCount} row${prevCount !== 1 ? "s" : ""} into ${groupCount} group${groupCount !== 1 ? "s" : ""}.`;
    }
    case "HAVING": {
      const havingCount = snapshot?.rowCount ?? 0;
      const prevCount = prevSnapshot?.rowCount ?? 0;
      return `Filtered ${prevCount} group${prevCount !== 1 ? "s" : ""} — ${havingCount} passed the HAVING condition.`;
    }
    case "SELECT":
      return "Projected only the selected columns.";
    case "ORDER_BY":
      return "Sorted the result set by the specified columns.";
    case "LIMIT":
      return `Limited the result set to ${snapshot?.rowCount ?? "N"} row${(snapshot?.rowCount ?? 0) !== 1 ? "s" : ""}.`;
  }
}

function getBaseTableName(select: Select): string {
  const froms = Array.isArray(select.from) ? select.from : [];
  const first = froms[0];
  if (first && "table" in first && first.table) {
    return String(first.table);
  }
  return "table";
}

function getJoinRightTableName(select: Select, joinIndex: number): string | undefined {
  const froms = Array.isArray(select.from) ? select.from : [];
  const joinItems = froms.filter((item) => "join" in item);
  const jItem = joinItems[joinIndex];
  if (jItem && "table" in jItem && jItem.table) {
    return String(jItem.table);
  }
  return undefined;
}

/** Returns the normalised join type string for the join at `joinIndex`. */
function getJoinType(select: Select, joinIndex = 0): string {
  const froms = Array.isArray(select.from) ? select.from : [];
  const joinItems = froms.filter((item) => "join" in item);
  const joinItem = joinItems[joinIndex];
  if (!joinItem) return "JOIN";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (joinItem as any).join as string | undefined;
  if (!raw) return "JOIN";
  const upper = raw.toUpperCase();
  if (upper === "INNER JOIN" || upper === "JOIN") return "INNER JOIN";
  if (upper === "LEFT JOIN" || upper === "LEFT OUTER JOIN") return "LEFT JOIN";
  return raw;
}

// ── Main export ──────────────────────────────────────────────────────────────

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
  const hasJoin = selectHasJoin(select);

  const snapshots: SimulatorSnapshot[] = [];
  let prevTrackedRows: TrackedRow[] | null = null;

  for (const stage of pipeline.stages) {
    // Pass joinIndex so JOIN stages build SQL only up to their specific join.
    const stageSqlResult = buildStageSql(select, stage.type, stage.joinIndex);

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

    // Assign stable row IDs by matching against the previous stage's rows.
    const trackedRows = assignRowIds(queryResult.rows, prevTrackedRows);

    // For JOIN stages, use the join type specific to this join (not the first one).
    const stageJoinType =
      stage.type === "JOIN"
        ? getJoinType(select, stage.joinIndex ?? 0)
        : getJoinType(select, 0); // fallback for non-JOIN stages (unused)

    // Build a partial snapshot to pass row counts into dynamic annotations.
    const partialSnapshot: SimulatorSnapshot = {
      stageId: stage.id,
      stageType: stage.type,
      label: stage.label,
      sql: stageSqlResult.sql,
      rows: trackedRows,
      rowCount: trackedRows.length,
      annotation: "", // filled below
    };

    const prevSnapshot =
      snapshots.length > 0 ? snapshots[snapshots.length - 1] : undefined;

    partialSnapshot.annotation = buildAnnotation(
      stage.type,
      tableName,
      hasJoin,
      stageJoinType,
      partialSnapshot,
      prevSnapshot
    );

    // For JOIN stages, fetch the right-hand table rows for the animation canvas.
    // joinIndex selects which join item's table to fetch (not always the first one).
    if (stage.type === "JOIN") {
      const jIdx = stage.joinIndex ?? 0;
      partialSnapshot.joinIndex = jIdx;
      partialSnapshot.joinRightTable = getJoinRightTableName(select, jIdx);
      const rightSql = buildRightTableSql(select, jIdx);
      if (rightSql) {
        const rightResult = await runQuery(db, rightSql);
        if (rightResult.success) {
          partialSnapshot.rightTableRows = assignRowIds(
            rightResult.rows,
            null // independent ID space for right table
          );
        }
      }
    }

    snapshots.push(partialSnapshot);
    prevTrackedRows = trackedRows;
  }

  // ── Compute inter-stage diffs ────────────────────────────────────────────
  const diffs: StageDiff[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    diffs.push(diffSnapshots(snapshots[i - 1], snapshots[i]));
  }

  return { success: true, snapshots, diffs };
}
