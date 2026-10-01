import type { StageAnimator } from "./stageAnimationTypes";
import { DURATION, EASE, HOLD, KEYFRAMES, animate, animateEach, rowEls } from "./motion";
import { settledView } from "./stageModel";
import { animateReduced } from "./morph";

/** FROM — the base table enters as one coherent dataset (fade + 10px rise). */
export const animateFrom: StageAnimator = async (ctx) => {
  const { ctl, root, model } = ctx;
  if (ctx.reducedMotion) return animateReduced(ctx, null);

  await ctl.phaseStep("focus", () => undefined);
  await ctl.phaseStep("action", async () => {
    const view = settledView(model);
    ctx.commit({ ...view, phase: "action" });
    const rows = rowEls(root);
    if (rows.length > 0 && rows.length <= 8) {
      const body = animate(ctl, root.querySelector("[data-grid-header]"), KEYFRAMES.enter(10), {
        duration: DURATION.enter,
        easing: EASE.enter,
      });
      const cascade = animateEach(ctl, rows, KEYFRAMES.enter(10), {
        duration: DURATION.enter,
        easing: EASE.enter,
        stagger: 20,
      });
      await ctl.waitAll([body, ...cascade]);
    } else {
      await ctl.waitAll([
        animate(ctl, root.querySelector("[data-grid]"), KEYFRAMES.enter(10), {
          duration: DURATION.enter,
          easing: EASE.enter,
        }),
      ]);
    }
  });
  await ctl.phaseStep("result", async () => {
    ctx.commit(settledView(model));
    await ctl.delay(HOLD.afterAction);
  });
};
