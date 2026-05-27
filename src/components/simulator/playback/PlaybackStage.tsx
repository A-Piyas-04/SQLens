import { memo, useEffect, useRef, type CSSProperties } from "react";
import type {
  SimulatorSnapshot,
  StageDiff,
  SimulatorStageType,
} from "../../../lib/simulator";
import {
  ANIM_MS,
  ENTRY_MS,
  STAGGER_MS,
  type PlaybackSpeed,
  type TransitionPhase,
} from "../../../hooks/useSimulatorPlayback";
import PlaybackTable from "./PlaybackTable";
import JoinPlaybackCanvas from "./JoinPlaybackCanvas";
import StageEntryBanner from "./StageEntryBanner";

const ACT1_RATIO = 0.4;
const ACT2_RATIO = 0.8;
const ACT3_RATIO = 0.3;

type Props = {
  snapshot: SimulatorSnapshot;
  prevSnapshot: SimulatorSnapshot | null;
  diff: StageDiff | null;
  animationKey: number;
  speed: PlaybackSpeed;
  transitionPhase: TransitionPhase;
  setTransitionPhase: (phase: TransitionPhase) => void;
  showRowIds: boolean;
};

function extractJoinType(annotation: string, label?: string): string {
  const src = label ?? annotation;
  const m = src.match(/\b(INNER|LEFT|RIGHT|FULL(?: OUTER)?|CROSS)?\s*JOIN\b/i);
  return m ? m[0].trim().toUpperCase() : "JOIN";
}

function parseStageIndex(stageId: string): number {
  const m = stageId.match(/^stage-(\d+)/);
  return m ? Number(m[1]) : 0;
}

function usesPrevRowsDuringTransform(stageType: SimulatorStageType): boolean {
  return (
    stageType === "WHERE" ||
    stageType === "HAVING" ||
    stageType === "LIMIT" ||
    stageType === "GROUP_BY" ||
    stageType === "SELECT"
  );
}

function shouldChoreograph(
  stageType: SimulatorStageType,
  prevSnapshot: SimulatorSnapshot | null
): boolean {
  if (stageType === "JOIN") return false;
  if (!prevSnapshot) return stageType === "FROM";
  return true;
}

const PlaybackStage = memo(function PlaybackStage({
  snapshot,
  prevSnapshot,
  diff,
  animationKey,
  speed,
  transitionPhase,
  setTransitionPhase,
  showRowIds,
}: Props) {
  const isJoin = snapshot.stageType === "JOIN";
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevStageIndexRef = useRef(parseStageIndex(snapshot.stageId));

  const animMs = ANIM_MS[speed];
  const act1Ms = Math.round(animMs * ACT1_RATIO);
  const act2Ms = Math.round(animMs * ACT2_RATIO);
  const act3Ms = Math.round(animMs * ACT3_RATIO);

  const clearTimeouts = () => {
    for (const id of timeoutsRef.current) clearTimeout(id);
    timeoutsRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };

  useEffect(() => {
    clearTimeouts();

    const newIndex = parseStageIndex(snapshot.stageId);
    const isBackward = newIndex < prevStageIndexRef.current;
    prevStageIndexRef.current = newIndex;

    if (isBackward || !shouldChoreograph(snapshot.stageType, prevSnapshot)) {
      setTransitionPhase("idle");
      return;
    }

    const finish = () => {
      setTransitionPhase("settled");
      schedule(() => setTransitionPhase("idle"), 50);
    };

    if (!prevSnapshot && snapshot.stageType === "FROM") {
      setTransitionPhase("transforming");
      schedule(() => setTransitionPhase("arriving"), act2Ms);
      schedule(() => finish(), act2Ms + act3Ms);
      return;
    }

    setTransitionPhase("departing");
    schedule(() => setTransitionPhase("transforming"), act1Ms);
    schedule(() => setTransitionPhase("arriving"), act1Ms + act2Ms);
    schedule(() => finish(), act1Ms + act2Ms + act3Ms);

    return clearTimeouts;
  }, [animationKey, snapshot.stageId, snapshot.stageType, prevSnapshot, speed, setTransitionPhase, act1Ms, act2Ms, act3Ms]);

  const showPrev =
    transitionPhase === "departing" ||
    (transitionPhase === "transforming" &&
      usesPrevRowsDuringTransform(snapshot.stageType));

  const displayRows = showPrev
    ? (prevSnapshot?.rows ?? snapshot.rows)
    : snapshot.rows;

  const displayPrevRows = prevSnapshot?.rows ?? [];
  const limitValue =
    snapshot.stageType === "LIMIT"
      ? (diff?.rowDiffs.find((d) => d.status === "removed")?.reason?.match(/LIMIT (\d+)/i)?.[1] ??
        String(snapshot.rowCount))
      : undefined;

  return (
    <div
      className="pb-stage-wrapper relative flex flex-1 flex-col min-h-0"
      style={
        {
          "--pb-anim-ms": `${animMs}ms`,
          "--pb-stagger-ms": `${STAGGER_MS[speed]}ms`,
          "--pb-act1-ms": `${act1Ms}ms`,
          "--pb-act2-ms": `${act2Ms}ms`,
          "--pb-act3-ms": `${act3Ms}ms`,
          "--pb-remove-ms": `${act2Ms}ms`,
          "--pb-entry-ms": `${ENTRY_MS[speed]}ms`,
        } as CSSProperties
      }
    >
      <StageEntryBanner stageType={snapshot.stageType} animationKey={animationKey} />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {isJoin ? (
          <JoinPlaybackCanvas
            leftRows={prevSnapshot?.rows ?? []}
            rightRows={snapshot.rightTableRows ?? []}
            joinedRows={snapshot.rows}
            joinType={extractJoinType(snapshot.annotation, snapshot.label)}
            joinSql={snapshot.sql}
            joinIndex={snapshot.joinIndex ?? 0}
            joinRightTable={snapshot.joinRightTable ?? null}
            animationKey={animationKey}
            speed={speed}
          />
        ) : (
          <PlaybackTable
            rows={displayRows}
            targetRows={snapshot.rows}
            prevRows={displayPrevRows}
            diff={diff}
            animationKey={animationKey}
            speed={speed}
            stageType={snapshot.stageType}
            transitionPhase={transitionPhase}
            showRowIds={showRowIds}
            prevRowCount={prevSnapshot?.rowCount ?? snapshot.rowCount}
            targetRowCount={snapshot.rowCount}
            limitValue={limitValue}
            stageSql={snapshot.sql}
          />
        )}
      </div>
    </div>
  );
});

export default PlaybackStage;
