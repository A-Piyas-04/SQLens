import type { JoinArrow, JoinViewState, StageAnimator } from "./stageAnimationTypes";
import { DURATION, EASE, HOLD, KEYFRAMES, animate, animateEach, cssEscape } from "./motion";
import { arrowKey } from "./joinModel";
import { settledJoinView } from "./stageModel";
import { animateReduced } from "./morph";

function findPath(root: HTMLElement, key: string): SVGPathElement | null {
  return root.querySelector<SVGPathElement>(`[data-arrow-key="${cssEscape(key)}"]`);
}

/**
 * JOIN (plan §9.8) on the global controller: panels enter → join keys focus →
 * one active pair at a time (curved path draws on, lane confirms, previous
 * arrows dim) → joined result rises in. Completion is reported like any stage.
 */
export const animateJoin: StageAnimator = async (ctx) => {
  const { ctl, root, model } = ctx;
  const join = model.join;
  if (!join) return;

  const base: JoinViewState = {
    kind: "join",
    phase: "focus",
    joinPhase: "tables",
    stepIndex: -1,
    pairIndex: 0,
    arrows: [],
    completedSteps: 0,
    laneMessage: null,
    showSkippedSummary: false,
    countPhase: "before",
  };

  if (ctx.reducedMotion) {
    return animateReduced(ctx, { ...base, joinPhase: "keys" });
  }

  let view = base;
  const commit = (next: Partial<JoinViewState>) => {
    view = { ...view, ...next };
    ctx.commit(view);
  };

  await ctl.phaseStep("focus", async () => {
    commit({});
    await ctl.waitAll([
      animate(ctl, root.querySelector("[data-join-panel='left']"), KEYFRAMES.enterX(-24), {
        duration: DURATION.enter,
        easing: EASE.enter,
      }),
      animate(ctl, root.querySelector("[data-join-panel='right']"), KEYFRAMES.enterX(24), {
        duration: DURATION.enter,
        easing: EASE.enter,
      }),
    ]);
    commit({ joinPhase: "keys" });
    await ctl.waitAll(
      animateEach(ctl, root.querySelectorAll("[data-join-key-header]"), KEYFRAMES.focus(), { duration: DURATION.focus })
    );
    await ctl.delay(HOLD.afterFocus);
  });

  await ctl.phaseStep("action", async () => {
    commit({ phase: "action", joinPhase: "matching" });
    for (let si = 0; si < join.animatedSteps.length; si++) {
      const step = join.animatedSteps[si];
      for (let pi = 0; pi < step.pairs.length; pi++) {
        const pair = step.pairs[pi];
        const key = arrowKey(step.leftId, pair, pi);
        const arrow: JoinArrow = {
          key,
          leftId: step.leftId,
          rightId: "rightId" in pair ? pair.rightId : null,
          isNull: "null" in pair,
          status: "drawing",
        };
        const settledArrows = view.arrows.map((a) =>
          a.status === "done" || a.leftId !== step.leftId ? { ...a, status: "done" as const } : { ...a, status: "active" as const }
        );
        commit({ stepIndex: si, pairIndex: pi, arrows: [...settledArrows, arrow], laneMessage: null });

        let path = findPath(root, key);
        if (!path) {
          await ctl.nextFrame();
          path = findPath(root, key);
        }
        if (path) {
          const length = typeof path.getTotalLength === "function" ? path.getTotalLength() : 0;
          if (length > 0) path.style.strokeDasharray = `${length}`;
          const draw = animate(ctl, path, KEYFRAMES.pathDraw(length || 1), {
            duration: DURATION.pathDraw,
            easing: EASE.standard,
            hold: true,
          });
          await ctl.waitAll([draw]);
          path.style.strokeDasharray = "";
          draw?.cancel();
        }

        commit({
          arrows: view.arrows.map((a) => (a.key === key ? { ...a, status: "active" } : a)),
          laneMessage: arrow.isNull ? "No match → NULL" : "✓ Match found",
        });
        await ctl.waitAll([
          animate(ctl, root.querySelector("[data-join-lane-message]"), KEYFRAMES.enter(6), {
            duration: DURATION.focus,
            easing: EASE.enter,
          }),
        ]);
        await ctl.delay(HOLD.joinPair);
        if (pi < step.pairs.length - 1) await ctl.delay(HOLD.joinBetween);
      }
      if (step.pairs.length > 1 && !("null" in step.pairs[0])) {
        commit({ laneMessage: `${step.pairs.length} matches` });
        await ctl.delay(HOLD.joinPair);
      }
      commit({
        completedSteps: si + 1,
        arrows: view.arrows.map((a) => ({ ...a, status: "done" })),
        laneMessage: null,
      });
      await ctl.delay(HOLD.joinBetween);
    }
    if (join.skippedStepCount > 0) {
      commit({ showSkippedSummary: true, stepIndex: -1 });
      await ctl.delay(HOLD.joinPair);
    }
  });

  await ctl.phaseStep("result", async () => {
    const settled = settledJoinView(model);
    commit({ ...settled, phase: "result", arrows: view.arrows.map((a) => ({ ...a, status: "done" })) });
    await ctl.waitAll([
      animate(ctl, root.querySelector("[data-join-result]"), KEYFRAMES.enter(16), {
        duration: DURATION.enter,
        easing: EASE.enter,
      }),
    ]);
    await ctl.delay(HOLD.result);
    commit({ phase: "settled" });
  });
};
