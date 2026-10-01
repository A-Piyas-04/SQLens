// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import PlaybackStage from "../PlaybackStage";
import type { AnimationState } from "../animation/stageAnimationTypes";
import { PLAYBACK_QUERIES } from "../__fixtures__/playbackQueries";
import {
  advance,
  advanceUntil,
  animationsMatching,
  expectSettledMatchesSnapshot,
  installDomStubs,
  recorded,
  simulate,
  stageIndex,
  stageInputs,
  useFakeTime,
  verticalMoves,
  type Simulation,
} from "./playbackTestUtils";

const sims = new Map<string, Simulation>();

beforeAll(async () => {
  for (const q of PLAYBACK_QUERIES) sims.set(q.id, await simulate(q.sql));
}, 120_000);

beforeEach(() => {
  installDomStubs();
  useFakeTime();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

type StageProps = ComponentProps<typeof PlaybackStage>;

function renderStage(sim: Simulation, index: number, overrides: Partial<StageProps> = {}) {
  const reports: Array<{ state: AnimationState; runKey: number }> = [];
  const onAnimationStateChange = vi.fn((state: AnimationState, runKey: number) => reports.push({ state, runKey }));
  let props: StageProps = {
    ...stageInputs(sim, index),
    runKey: 1,
    direction: "forward",
    distance: 1,
    speed: 1,
    paused: false,
    skipToken: 0,
    focusOnChanges: true,
    showRowIds: false,
    onAnimationStateChange,
    ...overrides,
  };
  const utils = render(<PlaybackStage {...props} />);
  const completes = (runKey = props.runKey) => reports.filter((r) => r.state === "complete" && r.runKey === runKey).length;
  return {
    ...utils,
    reports,
    completes,
    props: () => props,
    update(next: Partial<StageProps>) {
      props = { ...props, ...next };
      utils.rerender(<PlaybackStage {...props} />);
    },
    async settle(maxMs = 30000) {
      await advanceUntil(() => completes() > 0, maxMs);
    },
  };
}

describe("every fixture query settles to its snapshot (plan §18.3)", () => {
  for (const q of PLAYBACK_QUERIES) {
    it(`${q.label}`, async () => {
      const sim = sims.get(q.id)!;
      expect(sim.snapshots.map((s) => s.stageType)).toEqual(q.expectedStages);
      for (let i = 0; i < sim.snapshots.length; i++) {
        const stage = renderStage(sim, i);
        await stage.settle();
        expectSettledMatchesSnapshot(stage.container, sim.snapshots[i]);
        // Completion reported exactly once, even after extra time.
        await advance(3000);
        expect(stage.completes()).toBe(1);
        stage.unmount();
      }
    });
  }
});

describe("stage completion timing", () => {
  it("never reports complete before the choreography has run (WHERE)", async () => {
    const sim = sims.get("A-where")!;
    const stage = renderStage(sim, stageIndex(sim, "WHERE"));
    await advance(200);
    expect(stage.completes()).toBe(0);
    expect(stage.reports.at(-1)?.state).toBe("running");
    await stage.settle();
    expect(stage.completes()).toBe(1);
  });
});

describe("regressions (plan §20)", () => {
  it("R.1 ORDER BY animates on first visit (same nodes glide, no fade replacement)", async () => {
    const sim = sims.get("C-order-by")!;
    const stage = renderStage(sim, stageIndex(sim, "ORDER_BY"));
    await stage.settle();
    const moves = verticalMoves();
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((m) => m.el.hasAttribute("data-flip-id"))).toBe(true);
    expectSettledMatchesSnapshot(stage.container, stageInputs(sim, stageIndex(sim, "ORDER_BY")).snapshot);
  });

  it("R.2 ORDER BY replays correctly", async () => {
    const sim = sims.get("C-order-by")!;
    const i = stageIndex(sim, "ORDER_BY");
    const stage = renderStage(sim, i);
    await stage.settle();
    const before = recorded.length;
    stage.update({ runKey: 2 });
    await advanceUntil(() => stage.completes(2) > 0);
    expect(verticalMoves(before).length).toBeGreaterThan(0);
    expectSettledMatchesSnapshot(stage.container, sim.snapshots[i]);
  });

  it("R.3 ORDER BY after backward navigation", async () => {
    const sim = sims.get("D-limit")!;
    const ob = stageIndex(sim, "ORDER_BY");
    const lim = stageIndex(sim, "LIMIT");
    const stage = renderStage(sim, lim);
    await stage.settle();
    // ← back to ORDER BY: rows removed by LIMIT return, state equals ORDER BY.
    stage.update({ ...stageInputs(sim, ob), runKey: 2, direction: "backward", distance: 1 });
    await advanceUntil(() => stage.completes(2) > 0);
    expectSettledMatchesSnapshot(stage.container, sim.snapshots[ob]);
    // Replaying ORDER BY after going back still glides rows.
    const before = recorded.length;
    stage.update({ runKey: 3, direction: "forward", distance: 1 });
    await advanceUntil(() => stage.completes(3) > 0);
    expect(verticalMoves(before).length).toBeGreaterThan(0);
    expectSettledMatchesSnapshot(stage.container, sim.snapshots[ob]);
  });

  it("R.5 GROUP BY follower collapse is animated, not instant", async () => {
    const sim = sims.get("E-group-by")!;
    const i = stageIndex(sim, "GROUP_BY");
    const stage = renderStage(sim, i);
    await stage.settle();
    const collapses = animationsMatching(/scaleY\(0\.4\)/);
    expect(collapses.length).toBeGreaterThan(0);
    expect(collapses.every((c) => c.duration > 0)).toBe(true);
    // Grouped rows FLIP out of their group headers.
    expect(verticalMoves().length).toBeGreaterThan(0);
    expectSettledMatchesSnapshot(stage.container, sim.snapshots[i]);
  });

  it("GROUP BY shows aggregate inputs → snapshot result before collapsing", async () => {
    const sim = sims.get("E-group-by")!;
    const stage = renderStage(sim, stageIndex(sim, "GROUP_BY"));
    let sawAgg = false;
    await advanceUntil(() => {
      const agg = stage.container.querySelector("[data-agg]");
      if (agg && /÷/.test(agg.textContent ?? "") && /→/.test(agg.textContent ?? "")) sawAgg = true;
      return stage.completes() > 0;
    }, 30000, 25);
    expect(sawAgg).toBe(true);
  });

  it("R.6 SELECT removes body cells as well as headers", async () => {
    const sim = sims.get("B-select")!;
    const i = stageIndex(sim, "SELECT");
    const stage = renderStage(sim, i);
    await stage.settle();
    const exits = animationsMatching(/scaleX\(0\.6\)/);
    const exitedCols = new Set(exits.map((e) => (e.el as HTMLElement).dataset.col));
    expect(exitedCols.size).toBeGreaterThan(0);
    expect(exits.some((e) => e.el.getAttribute("role") === "cell")).toBe(true);
    expect(exits.some((e) => e.el.getAttribute("role") === "columnheader")).toBe(true);
    for (const col of exitedCols) {
      expect(stage.container.querySelector(`[data-col="${col}"]`)).toBeNull();
    }
    expectSettledMatchesSnapshot(stage.container, sim.snapshots[i]);
  });

  it("R.11 stage change cancels the active animation without completing it", async () => {
    const sim = sims.get("A-where")!;
    const w = stageIndex(sim, "WHERE");
    const stage = renderStage(sim, w);
    await advance(400);
    expect(stage.completes(1)).toBe(0);
    const inflight = recorded.filter((r) => r.anim.playState === "running");
    stage.update({ ...stageInputs(sim, w + 1), runKey: 2 });
    await advanceUntil(() => stage.completes(2) > 0);
    await advance(3000);
    expect(stage.completes(1)).toBe(0);
    expect(inflight.every((r) => r.anim.playState === "finished")).toBe(true);
    expectSettledMatchesSnapshot(stage.container, sim.snapshots[w + 1]);
  });

  it("R.13 reduced motion produces the correct final state with no large moves", async () => {
    const sim = sims.get("full")!;
    for (let i = 0; i < sim.snapshots.length; i++) {
      const stage = renderStage(sim, i, { reducedMotionOverride: true });
      await stage.settle();
      expectSettledMatchesSnapshot(stage.container, sim.snapshots[i]);
      stage.unmount();
    }
    expect(verticalMoves().length).toBe(0);
    expect(animationsMatching(/translateX\((?!0)/).length).toBe(0);
  });

  it("R.15 speed change does not restart the stage", async () => {
    const sim = sims.get("A-where")!;
    const stage = renderStage(sim, stageIndex(sim, "WHERE"));
    await advance(500);
    const phaseBefore = stage.container.querySelector("[data-phase-label]")?.textContent;
    const runningReports = stage.reports.filter((r) => r.state === "running").length;
    stage.update({ speed: 2 });
    await advance(1);
    expect(stage.container.querySelector("[data-phase-label]")?.textContent).toBe(phaseBefore);
    const active = recorded.filter((r) => r.anim.playState === "running");
    expect(active.every((r) => r.anim.playbackRate === 2)).toBe(true);
    await stage.settle();
    expect(stage.reports.filter((r) => r.state === "running").length).toBe(runningReports);
    expect(stage.completes()).toBe(1);
  });

  it("skip jumps the active stage to its settled state", async () => {
    const sim = sims.get("E-group-by")!;
    const i = stageIndex(sim, "GROUP_BY");
    const stage = renderStage(sim, i);
    await advance(300);
    stage.update({ skipToken: 1 });
    await advance(50);
    expect(stage.completes()).toBe(1);
    expectSettledMatchesSnapshot(stage.container, sim.snapshots[i]);
  });

  it("pause freezes the stage mid-animation; resume continues", async () => {
    const sim = sims.get("A-where")!;
    const stage = renderStage(sim, stageIndex(sim, "WHERE"));
    await advance(500);
    stage.update({ paused: true });
    await advance(1);
    const html = stage.container.innerHTML;
    await advance(10000);
    expect(stage.container.innerHTML).toBe(html);
    expect(stage.completes()).toBe(0);
    stage.update({ paused: false });
    await stage.settle();
    expect(stage.completes()).toBe(1);
  });
});

describe("T.7 stable playback rows", () => {
  it("keeps the same DOM node per _rowId across phases (no remount)", async () => {
    const sim = sims.get("A-where")!;
    const i = stageIndex(sim, "WHERE");
    const stage = renderStage(sim, i);
    await advance(1);
    const survivorId = sim.snapshots[i].rows[0]._rowId;
    const node = stage.container.querySelector(`[data-row-id="${survivorId}"]`);
    expect(node).not.toBeNull();
    const marks = new Set<string>();
    await advanceUntil(() => {
      const current = stage.container.querySelector<HTMLElement>(`[data-row-id="${survivorId}"]`);
      expect(current).toBe(node);
      if (current?.dataset.mark) marks.add(current.dataset.mark);
      return stage.completes() > 0;
    }, 30000, 20);
    expect(marks.has("pass")).toBe(true);
    expect(stage.container.querySelector(`[data-row-id="${survivorId}"]`)).toBe(node);
    expectSettledMatchesSnapshot(stage.container, sim.snapshots[i]);
  });

  it("failing rows show ✕ before leaving; survivors are not marked reordered", async () => {
    const sim = sims.get("A-where")!;
    const i = stageIndex(sim, "WHERE");
    const removed = sim.diffs[i - 1].rowDiffs.filter((d) => d.status === "removed").map((d) => d.rowId);
    expect(removed.length).toBeGreaterThan(0);
    expect(sim.diffs[i - 1].rowDiffs.filter((d) => d.status === "reordered")).toHaveLength(0);
    const stage = renderStage(sim, i);
    const failed = new Set<string>();
    await advanceUntil(() => {
      stage.container.querySelectorAll<HTMLElement>("[data-mark='fail']").forEach((el) => failed.add(el.dataset.rowId!));
      return stage.completes() > 0;
    }, 30000, 20);
    for (const id of removed) expect(failed.has(id)).toBe(true);
  });
});
