import type { GridItem, GridViewState, RowMark, StageAnimationContext, StageAnimator } from "./stageAnimationTypes";
import { DURATION, EASE, HOLD, KEYFRAMES, animateEach, columnEls, flip, measureRows, rowEls } from "./motion";
import {
  columnSpecs,
  hiddenColumnsLabel,
  rowItems,
  settledView,
  visibleRowIds,
  withSummary,
} from "./stageModel";
import { windowRows } from "./rowWindow";
import { animateReduced, morphTo } from "./morph";

/** Rows evaluated one-by-one when at most this many are visible. */
const SEQUENTIAL_LIMIT = 8;

type FilterVariant = "where" | "having" | "limit";

function buildSourceView(
  ctx: StageAnimationContext,
  variant: FilterVariant,
  marks: Map<string, RowMark>
): GridViewState {
  const { model } = ctx;
  const prevRows = model.prevSnapshot?.rows ?? [];
  const win = windowRows(prevRows, model.removedIds, model.rowLimit);
  let items: GridItem[] = rowItems(win.rows, { marks });

  if (variant === "limit") {
    const cutIndex = items.findIndex((i) => i.kind === "row" && model.removedIds.has(i.id));
    if (cutIndex >= 0) {
      items = [
        ...items.slice(0, cutIndex),
        { kind: "cutoff", id: "cutoff", label: `${model.conditionText ?? "LIMIT"} — rows below are cut` },
        ...items.slice(cutIndex),
      ];
    }
  }
  const noun = variant === "having" ? "group" : "row";
  return {
    kind: "grid",
    phase: "focus",
    items: withSummary(items, win.hiddenCount, noun),
    columns: columnSpecs(model.focusColumns, (k) => (model.emphasisColumns.has(k) ? "focus" : undefined)),
    hiddenColumnsLabel: hiddenColumnsLabel(model.prevColumns.length - model.focusColumns.length),
    caption: null,
    countPhase: "before",
  };
}

function withoutRows(view: GridViewState, ids: Set<string>): GridViewState {
  return { ...view, items: view.items.filter((i) => !(i.kind === "row" && ids.has(i.id))) };
}

/**
 * Shared row-exit choreography (plan §9.2–9.4):
 * focus predicate columns → evaluate rows ✓/✕ → failing rows leave
 * (translateX + fade) → survivors close the gap (FLIP) → result.
 */
export async function runRowFilter(ctx: StageAnimationContext, variant: FilterVariant): Promise<void> {
  const { ctl, root, model } = ctx;
  if (ctx.reducedMotion) {
    const marks = new Map<string, RowMark>([...model.removedIds].map((id) => [id, variant === "limit" ? "cut" : "fail"]));
    return animateReduced(ctx, buildSourceView(ctx, variant, marks));
  }

  let view = buildSourceView(ctx, variant, new Map());

  await ctl.phaseStep("focus", async () => {
    ctx.commit(view);
    const focusCells = [...model.emphasisColumns].flatMap((c) => columnEls(root, c));
    const cutoff = root.querySelectorAll("[data-flip-id='cutoff']");
    await ctl.waitAll([
      ...animateEach(ctl, focusCells, KEYFRAMES.focus(), { duration: DURATION.focus }),
      ...animateEach(ctl, cutoff, KEYFRAMES.enterX(-16), { duration: DURATION.focus }),
    ]);
    await ctl.delay(HOLD.afterFocus);
  });

  await ctl.phaseStep("action", async () => {
    const visibleRows = view.items.filter((i): i is Extract<GridItem, { kind: "row" }> => i.kind === "row");
    const marks = new Map<string, RowMark>();
    const failMark: RowMark = variant === "limit" ? "cut" : "fail";

    if (variant !== "limit" && visibleRows.length <= SEQUENTIAL_LIMIT) {
      for (const item of visibleRows) {
        marks.set(item.id, "testing");
        view = { ...view, phase: "action", items: applyMarks(view.items, marks) };
        ctx.commit(view);
        await ctl.delay(HOLD.evaluateRow * 0.5);
        marks.set(item.id, model.removedIds.has(item.id) ? failMark : "pass");
        view = { ...view, items: applyMarks(view.items, marks) };
        ctx.commit(view);
        await ctl.delay(HOLD.evaluateRow * 0.5);
      }
    } else {
      for (const item of visibleRows) {
        if (model.removedIds.has(item.id)) marks.set(item.id, failMark);
      }
      view = { ...view, phase: "action", items: applyMarks(view.items, marks) };
      ctx.commit(view);
      await ctl.delay(HOLD.evaluateRow * 2);
    }

    const leaving = rowEls(root, visibleRows.filter((i) => model.removedIds.has(i.id)).map((i) => i.id));
    const exitFrames = variant === "limit" ? KEYFRAMES.exitDown(10) : KEYFRAMES.exit(24);
    await ctl.waitAll(
      animateEach(ctl, leaving, exitFrames, {
        duration: DURATION.exit,
        easing: EASE.exit,
        stagger: Math.min(30, 240 / Math.max(leaving.length, 1)),
        hold: true,
      })
    );

    // Collapse: survivors glide up into the freed space.
    const first = measureRows(root);
    const passMarksCleared = new Map([...marks].filter(([, m]) => m !== "pass"));
    view = withoutRows({ ...view, items: applyMarks(view.items, passMarksCleared) }, model.removedIds);
    ctx.commit(view);
    await ctl.waitAll(flip(ctx, first, "rows", { duration: DURATION.collapse }).animations);
  });

  await ctl.phaseStep("result", async () => {
    await ctl.waitAll(morphTo(ctx, settledView(model, visibleRowIds(ctx.getView())), { enter: "fade" }));
    await ctl.delay(HOLD.result);
  });
}

function applyMarks(items: GridItem[], marks: Map<string, RowMark>): GridItem[] {
  return items.map((i) => (i.kind === "row" ? { ...i, mark: marks.get(i.id) } : i));
}

/** WHERE — rows failing the predicate leave. */
export const animateWhere: StageAnimator = (ctx) => runRowFilter(ctx, "where");
