import type { GridItem, GridViewState, StageAnimator } from "./stageAnimationTypes";
import type { GroupInfo } from "./groupModel";
import {
  DURATION,
  EASE,
  HOLD,
  KEYFRAMES,
  animate,
  animateEach,
  columnEls,
  flip,
  measureRows,
  rowEls,
  type RectMap,
} from "./motion";
import { columnSpecs, continueWindow, plural, rowItems, settledView, visibleRowIds, withSummary } from "./stageModel";
import { animateReduced, crossfadeTo, morphTo } from "./morph";

/** Groups and members drawn during gather; the rest are summarised. */
const MAX_GROUPS = 6;
const MAX_MEMBERS_PER_GROUP = 4;

type Shown = { group: GroupInfo; memberIds: string[] };

/**
 * GROUP BY (plan §9.7): focus keys + aggregate inputs → rows gather into
 * group containers → aggregates show their inputs → each group collapses into
 * its result row. Aggregate values always come from the actual snapshot.
 */
export const animateGroupBy: StageAnimator = async (ctx) => {
  const { ctl, root, model } = ctx;
  const group = model.group;
  const prevRows = model.prevSnapshot?.rows ?? [];
  if (!group || prevRows.length === 0) {
    await ctl.phaseStep("result", async () => {
      await ctl.waitAll(crossfadeTo(ctx, settledView(model)));
    });
    return;
  }

  const shown: Shown[] = group.groups
    .slice(0, MAX_GROUPS)
    .map((g) => ({ group: g, memberIds: g.memberIds.slice(0, MAX_MEMBERS_PER_GROUP) }));
  const shownIds = new Set(shown.flatMap((s) => s.memberIds));
  const rowById = new Map(prevRows.map((r) => [r._rowId, r]));
  const sourceRows = prevRows.filter((r) => shownIds.has(r._rowId));
  const hiddenSource = prevRows.length - sourceRows.length;
  const hiddenGroups = group.groups.length - shown.length;
  const groupIndex = group.groupIndexByRowId;
  const columns = columnSpecs(model.focusColumns, (k) => (model.emphasisColumns.has(k) ? "focus" : undefined));
  const hiddenCols = model.prevColumns.length - model.focusColumns.length;

  const focusView: GridViewState = {
    kind: "grid",
    phase: "focus",
    items: withSummary(rowItems(sourceRows), hiddenSource),
    columns,
    hiddenColumnsLabel: hiddenCols > 0 ? `+${hiddenCols} column${hiddenCols === 1 ? "" : "s"} not used by GROUP BY hidden` : null,
    caption: null,
    countPhase: "before",
  };

  if (ctx.reducedMotion) return animateReduced(ctx, focusView);

  const gatheredItems = (withAggregates: boolean): GridItem[] => {
    const items: GridItem[] = [];
    for (const { group: g, memberIds } of shown) {
      items.push({
        kind: "group",
        id: `group-${g.index}`,
        groupIndex: g.index,
        label: g.label,
        count: g.memberIds.length,
        aggregates: withAggregates ? g.aggregates : undefined,
      });
      items.push(...rowItems(memberIds.map((id) => rowById.get(id)!), { groupIndex }));
    }
    const notShown = hiddenSource;
    if (notShown > 0 || hiddenGroups > 0) {
      items.push({
        kind: "summary",
        id: "summary",
        label: `+ ${plural(notShown, "other row")}${hiddenGroups > 0 ? ` in ${plural(hiddenGroups, "more group")}` : ""}`,
      });
    }
    return items;
  };

  await ctl.phaseStep("focus", async () => {
    ctx.commit(focusView);
    const focusCells = [...model.emphasisColumns].flatMap((c) => columnEls(root, c));
    await ctl.waitAll(animateEach(ctl, focusCells, KEYFRAMES.focus(), { duration: DURATION.focus }));
    await ctl.delay(HOLD.afterFocus);
  });

  // Phase B — gather: rows physically move into their group container.
  await ctl.phaseStep("action", async () => {
    ctx.commit({ ...focusView, phase: "action", items: withSummary(rowItems(sourceRows, { groupIndex }), hiddenSource) });
    await ctl.delay(HOLD.afterAction);
    const first = measureRows(root);
    ctx.commit({ ...focusView, phase: "action", items: gatheredItems(false) });
    const { animations, entered } = flip(ctx, first, "rows", { duration: DURATION.move });
    await ctl.waitAll([
      ...animations,
      ...animateEach(ctl, entered, KEYFRAMES.fadeIn(0), { duration: DURATION.enter, easing: EASE.enter }),
    ]);

    // Phase C — aggregate: show where each value comes from.
    if (group.aggregates.length > 0) {
      ctx.commit({ ...focusView, phase: "action", items: gatheredItems(true) });
      const chips = root.querySelectorAll("[data-agg]");
      await ctl.waitAll(
        animateEach(ctl, chips, KEYFRAMES.enter(6), { duration: DURATION.enter, easing: EASE.enter, stagger: 60 })
      );
      await ctl.delay(HOLD.aggregate);
    }

    // Phase D — collapse: members fold away, each group becomes one output row.
    // A group's result row may reuse a member's _rowId (same DOM node), so that
    // member must not be faded out — it FLIPs from the group header instead.
    const mappedTargets = new Set(shown.map((s) => s.group.targetRowId).filter((id): id is string => !!id));
    const members = rowEls(root, [...shownIds].filter((id) => !mappedTargets.has(id)));
    await ctl.waitAll(
      animateEach(ctl, members, KEYFRAMES.collapse(), { duration: DURATION.collapse, easing: EASE.exit, hold: true })
    );

    const headerFirst: RectMap = new Map();
    for (const { group: g } of shown) {
      if (!g.targetRowId) continue;
      const header = root.querySelector<HTMLElement>(`[data-flip-id="group-${g.index}"]`);
      if (!header) continue;
      const r = header.getBoundingClientRect();
      headerFirst.set(g.targetRowId, { left: r.left, top: r.top });
    }
    const win = continueWindow(model.snapshot.rows, mappedTargets, model.rowLimit);
    ctx.commit({
      kind: "grid",
      phase: "action",
      items: withSummary(rowItems(win.rows, { groupIndex }), win.hiddenCount, "group"),
      columns: columnSpecs(model.targetColumns),
      hiddenColumnsLabel: null,
      caption: null,
      countPhase: "after",
    });
    const collapsed = flip(ctx, headerFirst, "rows", { duration: DURATION.move });
    await ctl.waitAll([
      ...collapsed.animations,
      ...animateEach(ctl, collapsed.entered, KEYFRAMES.fadeIn(0), { duration: DURATION.enter }),
      animate(ctl, root.querySelector("[data-grid-header]"), KEYFRAMES.fadeIn(0.4), { duration: DURATION.enter }),
    ]);
  });

  await ctl.phaseStep("result", async () => {
    await ctl.waitAll(morphTo(ctx, settledView(model, visibleRowIds(ctx.getView()))));
    await ctl.delay(HOLD.result);
  });
};
