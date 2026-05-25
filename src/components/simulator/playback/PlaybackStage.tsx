import { memo } from "react";
import type {
  SimulatorSnapshot,
  StageDiff,
  TrackedRow,
} from "../../../lib/simulator";
import type { PlaybackSpeed } from "../../../hooks/useSimulatorPlayback";
import PlaybackTable from "./PlaybackTable";
import JoinPlaybackCanvas from "./JoinPlaybackCanvas";
import StageAnnotation from "./StageAnnotation";

type Props = {
  snapshot:      SimulatorSnapshot;
  prevSnapshot:  SimulatorSnapshot | null;
  diff:          StageDiff | null;
  animationKey:  number;
  speed:         PlaybackSpeed;
};

/** Extract join type from the annotation text ("INNER JOIN", "LEFT JOIN", etc.). */
function extractJoinType(annotation: string): string {
  const m = annotation.match(/\b(INNER|LEFT|RIGHT|FULL(?: OUTER)?|CROSS)?\s*JOIN\b/i);
  return m ? m[0].toUpperCase() : "JOIN";
}

const PlaybackStage = memo(function PlaybackStage({
  snapshot,
  prevSnapshot,
  diff,
  animationKey,
  speed,
}: Props) {
  const isJoin = snapshot.stageType === "JOIN";

  // Gather removed rows from the diff to show them inline at filtering stages
  const removedRows: TrackedRow[] = [];
  if (diff && (snapshot.stageType === "WHERE" || snapshot.stageType === "HAVING" || snapshot.stageType === "LIMIT")) {
    const removedIds = new Set(
      diff.rowDiffs.filter((d) => d.status === "removed").map((d) => d.rowId)
    );
    if (prevSnapshot) {
      for (const row of prevSnapshot.rows) {
        if (removedIds.has(row._rowId)) removedRows.push(row);
      }
    }
  }

  return (
    // `relative` so the floating StageAnnotation can be absolutely positioned
    <div className="relative flex flex-1 flex-col min-h-0">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isJoin ? (
          <JoinPlaybackCanvas
            leftRows={prevSnapshot?.rows ?? []}
            rightRows={snapshot.rightTableRows ?? []}
            joinedRows={snapshot.rows}
            joinType={extractJoinType(snapshot.annotation)}
            animationKey={animationKey}
            speed={speed}
          />
        ) : (
          <PlaybackTable
            rows={snapshot.rows}
            diff={diff}
            animationKey={animationKey}
            speed={speed}
            stageType={snapshot.stageType}
            removedRows={removedRows}
          />
        )}
      </div>

      {/* Floating explanation pop-up — bottom-right of this container */}
      <StageAnnotation snapshot={snapshot} diff={diff} animationKey={animationKey} />
    </div>
  );
});

export default PlaybackStage;
