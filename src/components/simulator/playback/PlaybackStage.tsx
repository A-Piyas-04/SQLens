import { memo, useCallback, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { SimulatorSnapshot, StageDiff } from "../../../lib/simulator";
import PlaybackDataGrid from "./PlaybackDataGrid";
import JoinPlaybackCanvas from "./JoinPlaybackCanvas";
import PlaybackOperationBar from "./PlaybackOperationBar";
import type {
  AnimationState,
  PlaybackDirection,
  StageAnimationContext,
  StageViewState,
} from "./animation/stageAnimationTypes";
import type { JoinModel } from "./animation/joinModel";
import { buildStageModel, countLabels } from "./animation/stageModel";
import { extractStageExpression, STAGE_LABEL } from "./animation/stageSqlParts";
import { runStageAnimation } from "./animation/runStageAnimation";
import { useReducedMotion, useStageAnimationController } from "./animation/useStageAnimationController";

type Props = {
  snapshot: SimulatorSnapshot;
  prevSnapshot: SimulatorSnapshot | null;
  diff: StageDiff | null;
  originalSql: string;
  /** Incremented on every navigation / replay; starts a new stage run. */
  runKey: number;
  direction: PlaybackDirection;
  distance: number;
  speed: number;
  paused: boolean;
  skipToken: number;
  focusOnChanges: boolean;
  showRowIds: boolean;
  onAnimationStateChange: (state: AnimationState, runKey: number) => void;
  /** Test hook: force reduced-motion choreography. */
  reducedMotionOverride?: boolean;
};

type Committed = { view: StageViewState; join: JoinModel | null };

/**
 * Stage choreography host. Mounts one stable visualisation tree, hands the
 * active stage animator a `commit()` that updates the DOM synchronously (so
 * FLIP can measure FIRST/LAST), and reports the controller state upward.
 */
const PlaybackStage = memo(function PlaybackStage({
  snapshot,
  prevSnapshot,
  diff,
  originalSql,
  runKey,
  direction,
  distance,
  speed,
  paused,
  skipToken,
  focusOnChanges,
  showRowIds,
  onAnimationStateChange,
  reducedMotionOverride,
}: Props) {
  const systemReduced = useReducedMotion();
  const reducedMotion = reducedMotionOverride ?? systemReduced;
  const rootRef = useRef<HTMLDivElement>(null);
  const [committed, setCommitted] = useState<Committed | null>(null);
  const committedRef = useRef<Committed | null>(null);

  const model = useMemo(
    () => buildStageModel({ snapshot, prevSnapshot, diff, originalSql, focusOnChanges }),
    [snapshot, prevSnapshot, diff, originalSql, focusOnChanges]
  );
  const modelRef = useRef(model);
  modelRef.current = model;
  const runOpts = useRef({ direction, distance });
  runOpts.current = { direction, distance };

  const commit = useCallback((view: StageViewState) => {
    const next = { view, join: modelRef.current.join };
    committedRef.current = next;
    flushSync(() => setCommitted(next));
  }, []);

  const run = useCallback(
    async (ctl: StageAnimationContext["ctl"]) => {
      const root = rootRef.current;
      if (!root) return;
      const ctx: StageAnimationContext = {
        ctl,
        root,
        model: modelRef.current,
        reducedMotion: ctl.reducedMotion,
        commit,
        getView: () => committedRef.current?.view ?? null,
      };
      await runStageAnimation(ctx, runOpts.current);
    },
    [commit]
  );

  const [animState, setAnimState] = useState<{ state: AnimationState; runKey: number }>({ state: "idle", runKey });

  useStageAnimationController({
    runKey,
    label: `${snapshot.stageId}:${snapshot.stageType}`,
    speed,
    paused,
    skipToken,
    reducedMotion,
    onStateChange: (state, key) => {
      setAnimState({ state, runKey: Number(key) });
      onAnimationStateChange(state, Number(key));
    },
    run,
  });

  const view = committed?.view ?? null;
  const stageComplete = animState.runKey === runKey && animState.state === "complete";
  // "Done" only once the controller has completed; trailing result holds read as "Result".
  const phase = stageComplete ? "settled" : view?.phase === "settled" ? "result" : view?.phase ?? "focus";
  const counts = countLabels(model);
  const expression = useMemo(
    () => extractStageExpression(originalSql, snapshot.stageType, snapshot.joinIndex ?? 0),
    [originalSql, snapshot.stageType, snapshot.joinIndex]
  );

  return (
    <div className="pb-stage relative flex min-h-0 flex-1 flex-col" data-stage-type={snapshot.stageType}>
      <PlaybackOperationBar
        stageType={snapshot.stageType}
        expression={expression}
        beforeLabel={counts.before}
        afterLabel={counts.after}
        countPhase={view?.countPhase ?? "before"}
        phase={phase}
        showBefore={prevSnapshot !== null}
      />
      <div ref={rootRef} data-stage-root className="min-h-0 flex-1 overflow-auto p-4 lg:p-5">
        <div data-stage-content>
          {view?.kind === "join" && committed?.join ? (
            <JoinPlaybackCanvas model={committed.join} view={view} />
          ) : view?.kind === "grid" ? (
            <div className="flex flex-col gap-2">
              {view.hiddenColumnsLabel && (
                <p data-hidden-columns className="text-[10px] text-ink-muted">
                  {view.hiddenColumnsLabel}
                </p>
              )}
              <PlaybackDataGrid
                view={view}
                showRowIds={showRowIds}
                label={`${STAGE_LABEL[snapshot.stageType]} intermediate result`}
              />
              {view.caption && (
                <p data-caption className="text-xs text-ink-secondary">
                  {view.caption}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export default PlaybackStage;
