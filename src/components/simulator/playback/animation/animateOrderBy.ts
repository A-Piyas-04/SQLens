import type { GridViewState, StageAnimator } from "./stageAnimationTypes";
import { DURATION, HOLD, KEYFRAMES, animateEach, columnEls, flip, measureRows, EASE } from "./motion";
import {
  columnSpecs,
  continueWindow,
  hiddenColumnsLabel,
  rowItems,
  settledView,
  visibleRowIds,
  withSummary,
} from "./stageModel";
import { windowRows } from "./rowWindow";
import { animateReduced, morphTo } from "./morph";

/** Rows moving at least this many positions get a subtle ↑/↓ hint. */
const HINT_MIN_DISTANCE = 2;

/**
 * ORDER BY — the same row elements glide from their previous Y to the new Y
 * (FLIP: FIRST measured on the committed pre-sort view, LAST after commit).
 */
export const animateOrderBy: StageAnimator = async (ctx) => {
  const { ctl, root, model } = ctx;
  const prevRows = model.prevSnapshot?.rows ?? [];
  const movers = (model.diff?.rowDiffs ?? []).filter((d) => d.status === "reordered");
  const win = windowRows(prevRows, movers.map((d) => d.rowId), model.rowLimit);
  const columns = columnSpecs(model.focusColumns, (k) => (model.emphasisColumns.has(k) ? "focus" : undefined));

  const focusView: GridViewState = {
    kind: "grid",
    phase: "focus",
    items: withSummary(rowItems(win.rows), win.hiddenCount),
    columns,
    hiddenColumnsLabel: hiddenColumnsLabel(model.prevColumns.length - model.focusColumns.length),
    caption: null,
    countPhase: "before",
  };

  if (ctx.reducedMotion) return animateReduced(ctx, focusView);

  await ctl.phaseStep("focus", async () => {
    ctx.commit(focusView);
    const sortCells = [...model.emphasisColumns].flatMap((c) => columnEls(root, c));
    await ctl.waitAll(animateEach(ctl, sortCells, KEYFRAMES.focus(), { duration: DURATION.focus }));
    await ctl.delay(HOLD.afterFocus);
  });

  await ctl.phaseStep("action", async () => {
    const hints = new Map<string, "up" | "down">();
    for (const d of movers) {
      if (d.prevIndex === undefined || d.currIndex === undefined) continue;
      const delta = d.currIndex - d.prevIndex;
      if (Math.abs(delta) >= HINT_MIN_DISTANCE) hints.set(d.rowId, delta < 0 ? "up" : "down");
    }
    const sorted = continueWindow(model.snapshot.rows, new Set(win.rows.map((r) => r._rowId)), model.rowLimit);

    const first = measureRows(root);
    ctx.commit({
      ...focusView,
      phase: "action",
      items: withSummary(rowItems(sorted.rows, { hints }), sorted.hiddenCount),
    });
    const { animations, entered } = flip(ctx, first, "rows", { duration: DURATION.move, easing: EASE.standard });
    await ctl.waitAll([
      ...animations,
      ...animateEach(ctl, entered, KEYFRAMES.fadeIn(0), { duration: DURATION.enter }),
    ]);
  });

  await ctl.phaseStep("result", async () => {
    await ctl.waitAll(morphTo(ctx, settledView(model, visibleRowIds(ctx.getView()))));
    await ctl.delay(HOLD.result);
  });
};
