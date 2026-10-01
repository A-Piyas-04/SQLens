import type { GridViewState, StageAnimator } from "./stageAnimationTypes";
import { DURATION, EASE, HOLD, KEYFRAMES, animateEach, columnEls } from "./motion";
import { columnSpecs, rowItems, settledView, visibleRowIds, withSummary } from "./stageModel";
import { windowRows } from "./rowWindow";
import { animateReduced, morphTo } from "./morph";

/**
 * SELECT — selected columns are emphasised, dropped columns dim, then leave
 * (header AND body cells together), survivors slide into place, computed
 * columns appear in the result.
 */
export const animateSelect: StageAnimator = async (ctx) => {
  const { ctl, root, model } = ctx;
  const prevRows = model.prevSnapshot?.rows ?? [];
  const win = windowRows(prevRows, [], model.rowLimit);
  const kept = model.focusColumns.filter((c) => model.targetColumns.includes(c));
  const dropped = model.focusColumns.filter((c) => !model.targetColumns.includes(c));
  const unseenDropped = model.prevColumns.filter(
    (c) => !model.targetColumns.includes(c) && !model.focusColumns.includes(c)
  ).length;

  const focusView: GridViewState = {
    kind: "grid",
    phase: "focus",
    items: withSummary(rowItems(win.rows), win.hiddenCount),
    columns: columnSpecs(model.focusColumns, (k) => (kept.includes(k) ? "focus" : "dropped")),
    hiddenColumnsLabel:
      unseenDropped > 0 ? `+${unseenDropped} more dropped column${unseenDropped === 1 ? "" : "s"} not shown` : null,
    caption: null,
    countPhase: "before",
  };

  if (ctx.reducedMotion) return animateReduced(ctx, focusView);

  await ctl.phaseStep("focus", async () => {
    ctx.commit(focusView);
    const droppedCells = dropped.flatMap((c) => columnEls(root, c));
    const keptCells = kept.flatMap((c) => columnEls(root, c));
    await ctl.waitAll([
      ...animateEach(ctl, droppedCells, KEYFRAMES.dim(0.35), { duration: DURATION.dim }),
      ...animateEach(ctl, keptCells, KEYFRAMES.focus(), { duration: DURATION.focus }),
    ]);
    await ctl.delay(HOLD.afterFocus);
  });

  await ctl.phaseStep("action", async () => {
    const droppedCells = dropped.flatMap((c) => columnEls(root, c));
    await ctl.waitAll(
      animateEach(ctl, droppedCells, KEYFRAMES.columnExit(), {
        duration: DURATION.exit,
        easing: EASE.exit,
        hold: true,
      })
    );
    const keptView: GridViewState = {
      ...focusView,
      phase: "action",
      columns: columnSpecs(kept, () => "focus"),
      hiddenColumnsLabel: null,
    };
    await ctl.waitAll(morphTo(ctx, keptView, { duration: DURATION.move }));
  });

  await ctl.phaseStep("result", async () => {
    await ctl.waitAll(morphTo(ctx, settledView(model, visibleRowIds(ctx.getView()))));
    await ctl.delay(HOLD.result);
  });
};
