import type { AnimationLike, StageAnimationContext, StageViewState } from "./stageAnimationTypes";
import { DURATION, EASE, HOLD, KEYFRAMES, animate, animateEach, flip, measureCells, measureRows } from "./motion";
import { settledView, visibleRowIds } from "./stageModel";

type MorphOptions = {
  /** How rows without a previous position arrive. */
  enter?: "fade" | "fromRight" | "fromTop";
  duration?: number;
};

/**
 * Commits `next` and animates the difference from the current DOM:
 * surviving rows/cells glide (FLIP), new rows and columns fade in.
 */
export function morphTo(ctx: StageAnimationContext, next: StageViewState, opts: MorphOptions = {}): AnimationLike[] {
  const { root, ctl, reducedMotion } = ctx;
  const firstRows = measureRows(root);
  const firstCells = measureCells(root);
  ctx.commit(next);
  ctl.throwIfCancelled();

  const duration = opts.duration ?? DURATION.move;
  const rows = flip(ctx, firstRows, "rows", { duration });
  const enteredRowIds = new Set(rows.entered.map((el) => el.dataset.flipId));
  const cells = flip(ctx, firstCells, "cells", { duration });
  const enteredCells = cells.entered.filter((el) => {
    const owner = el.closest<HTMLElement>("[data-flip-id]")?.dataset.flipId;
    return !owner || !enteredRowIds.has(owner);
  });

  const anims = [...rows.animations, ...cells.animations];
  if (reducedMotion) {
    anims.push(...animateEach(ctl, [...rows.entered, ...enteredCells], KEYFRAMES.fadeIn(0.4), { duration: DURATION.reduced }));
    return anims;
  }
  const enterFrames =
    opts.enter === "fromRight" ? KEYFRAMES.enterX(24) : opts.enter === "fromTop" ? KEYFRAMES.enter(-10) : KEYFRAMES.fadeIn(0);
  anims.push(
    ...animateEach(ctl, rows.entered, enterFrames, {
      duration: DURATION.enter,
      easing: EASE.enter,
      stagger: rows.entered.length <= 8 ? 25 : 0,
    })
  );
  anims.push(...animateEach(ctl, enteredCells, KEYFRAMES.fadeIn(0), { duration: DURATION.enter, easing: EASE.enter }));
  return anims;
}

/** Crossfade between structurally different views (grid ⇄ JOIN canvas). */
export function crossfadeTo(ctx: StageAnimationContext, next: StageViewState): AnimationLike[] {
  ctx.commit(next);
  const content = ctx.root.querySelector("[data-stage-content]");
  const frames = ctx.reducedMotion ? KEYFRAMES.fadeIn(0.5) : KEYFRAMES.enter(8);
  const a = animate(ctx.ctl, content, frames, {
    duration: ctx.reducedMotion ? DURATION.reduced : DURATION.enter,
    easing: EASE.enter,
  });
  return a ? [a] : [];
}

/**
 * Backward navigation and multi-stage jumps: reverse the operation where the
 * DOM allows it (rows return, columns reappear, rows slide back), otherwise a
 * short crossfade.
 */
export async function animateMorph(ctx: StageAnimationContext, direction: "forward" | "backward"): Promise<void> {
  const { ctl, model } = ctx;
  const current = ctx.getView();
  const target = settledView(model, visibleRowIds(current));
  await ctl.phaseStep("action", async () => {
    if (!current || current.kind !== target.kind || target.kind === "join") {
      await ctl.waitAll(crossfadeTo(ctx, target));
      return;
    }
    await ctl.waitAll(morphTo(ctx, target, { enter: direction === "backward" ? "fromRight" : "fade" }));
  });
}

/**
 * Reduced-motion choreography: show the "before" focus state with its labels,
 * hold briefly, then switch to the exact result with a quick opacity change.
 */
export async function animateReduced(ctx: StageAnimationContext, before: StageViewState | null): Promise<void> {
  const { ctl, model } = ctx;
  if (before) {
    await ctl.phaseStep("focus", async () => {
      ctx.commit(before);
      await ctl.delay(HOLD.afterFocus);
    });
  }
  await ctl.phaseStep("result", async () => {
    await ctl.waitAll(crossfadeTo(ctx, settledView(model)));
  });
}
