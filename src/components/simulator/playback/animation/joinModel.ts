import type { SimulatorSnapshot, TrackedRow } from "../../../../lib/simulator";
import {
  buildJoinMatchSteps,
  countJoinLayers,
  resolvePlaybackJoinKeys,
  type JoinMatchStep,
  type PanelJoinKeys,
} from "../join/joinPlaybackModel";
import { columnsOf, identityColumn } from "./relevantColumns";

/** Match steps animated one at a time; the rest are summarised. */
export const MAX_ANIMATED_STEPS = 6;
/** Rows listed per side before "+N more rows". */
export const JOIN_PANEL_ROWS = 10;

export type JoinModel = {
  joinType: string;
  isLeftJoin: boolean;
  keys: PanelJoinKeys;
  leftRows: TrackedRow[];
  rightRows: TrackedRow[];
  joinedRows: TrackedRow[];
  leftIdentity: string | null;
  rightIdentity: string | null;
  steps: JoinMatchStep[];
  /** Steps the animation walks through (matched or null-extended). */
  animatedSteps: JoinMatchStep[];
  skippedStepCount: number;
};

export function extractJoinType(annotation: string, label?: string): string {
  const src = label ?? annotation;
  const m = src.match(/\b(INNER|LEFT|RIGHT|FULL(?: OUTER)?|CROSS)?\s*JOIN\b/i);
  const fromLabel = m ? m[0].trim().toUpperCase() : "";
  if (fromLabel && fromLabel !== "JOIN") return fromLabel;
  const fromAnnotation = annotation.match(/\b(INNER|LEFT|RIGHT|FULL)(?: OUTER)? JOIN\b/i);
  return fromAnnotation ? fromAnnotation[0].toUpperCase() : fromLabel || "JOIN";
}

export function buildJoinModel(snapshot: SimulatorSnapshot, prevSnapshot: SimulatorSnapshot | null): JoinModel {
  const leftRows = prevSnapshot?.rows ?? [];
  const rightRows = snapshot.rightTableRows ?? [];
  const joinedRows = snapshot.rows;
  const joinType = extractJoinType(snapshot.annotation, snapshot.label);
  const isLeftJoin = joinType.includes("LEFT");
  const joinIndex = snapshot.joinIndex ?? 0;
  const keys = resolvePlaybackJoinKeys(
    snapshot.sql,
    joinIndex,
    countJoinLayers(snapshot.sql),
    snapshot.joinRightTable ?? null,
    leftRows,
    rightRows
  );
  const steps = buildJoinMatchSteps(leftRows, rightRows, joinedRows, keys.leftKey, keys.rightKey, isLeftJoin);
  const withPairs = steps.filter((s) => s.pairs.length > 0);
  const animatedSteps = withPairs.slice(0, MAX_ANIMATED_STEPS);
  const leftCols = columnsOf(leftRows);
  const rightCols = columnsOf(rightRows);

  return {
    joinType,
    isLeftJoin,
    keys,
    leftRows,
    rightRows,
    joinedRows,
    leftIdentity: identityColumn(leftRows, leftCols, keys.leftKey ? [keys.leftKey] : []),
    rightIdentity: identityColumn(rightRows, rightCols, keys.rightKey ? [keys.rightKey] : []),
    steps,
    animatedSteps,
    skippedStepCount: Math.max(0, withPairs.length - animatedSteps.length),
  };
}

export function arrowKey(leftId: string, pair: { rightId: string } | { null: true }, pairIndex: number): string {
  return "null" in pair ? `${leftId}->null-${pairIndex}` : `${leftId}->${pair.rightId}`;
}
