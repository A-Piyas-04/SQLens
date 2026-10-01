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
  expectSettledMatchesSnapshot,
  installDomStubs,
  recorded,
  setGeometryScale,
  simulate,
  stageIndex,
  stageInputs,
  triggerResize,
  useFakeTime,
  type Simulation,
} from "./playbackTestUtils";

const sims = new Map<string, Simulation>();

beforeAll(async () => {
  for (const id of ["G-inner-join", "H-left-join", "I-one-to-many"]) {
    sims.set(id, await simulate(PLAYBACK_QUERIES.find((q) => q.id === id)!.sql));
  }
}, 120_000);

beforeEach(() => {
  installDomStubs();
  useFakeTime();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderJoin(id: string, overrides: Partial<ComponentProps<typeof PlaybackStage>> = {}) {
  const sim = sims.get(id)!;
  const index = stageIndex(sim, "JOIN");
  const reports: Array<{ state: AnimationState; runKey: number }> = [];
  let props: ComponentProps<typeof PlaybackStage> = {
    ...stageInputs(sim, index),
    runKey: 1,
    direction: "forward",
    distance: 1,
    speed: 1,
    paused: false,
    skipToken: 0,
    focusOnChanges: true,
    showRowIds: false,
    onAnimationStateChange: (state, runKey) => reports.push({ state, runKey }),
    ...overrides,
  };
  const utils = render(<PlaybackStage {...props} />);
  const completes = () => reports.filter((r) => r.state === "complete").length;
  return {
    ...utils,
    sim,
    snapshot: sim.snapshots[index],
    completes,
    update(next: Partial<ComponentProps<typeof PlaybackStage>>) {
      props = { ...props, ...next };
      utils.rerender(<PlaybackStage {...props} />);
    },
  };
}

const q = (root: HTMLElement, sel: string) => root.querySelector<HTMLElement>(sel);
const qa = (root: HTMLElement, sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];

describe("T.8 JOIN playback", () => {
  it("lays out LEFT | MATCH LANE | RIGHT and focuses the join keys", async () => {
    const j = renderJoin("G-inner-join");
    await advance(1);
    expect(q(j.container, "[data-join-panel='left']")).not.toBeNull();
    expect(q(j.container, "[data-join-panel='right']")).not.toBeNull();
    await advanceUntil(() => qa(j.container, "[data-join-key-header][data-focused]").length === 2, 5000, 10);
  });

  it("shows one current pair at a time and dims previous arrows", async () => {
    const j = renderJoin("G-inner-join");
    let maxActiveLeft = 0;
    let sawDimmedWhileActive = false;
    let sawMatchMessage = false;
    await advanceUntil(() => {
      const activeLeft = qa(j.container, "[data-join-panel='left'] [data-state='active']").length;
      maxActiveLeft = Math.max(maxActiveLeft, activeLeft);
      const done = qa(j.container, "path[data-status='done']").length;
      const active = qa(j.container, "path[data-status='active'], path[data-status='drawing']").length;
      if (done > 0 && active > 0) sawDimmedWhileActive = true;
      if (q(j.container, "[data-join-lane-message]")?.textContent === "✓ Match found") sawMatchMessage = true;
      return j.completes() > 0;
    }, 60000, 20);
    expect(maxActiveLeft).toBe(1);
    expect(sawDimmedWhileActive).toBe(true);
    expect(sawMatchMessage).toBe(true);
    expectSettledMatchesSnapshot(j.container, j.snapshot);
  });

  it("dimmed (done) arrows render at ~0.2 opacity", async () => {
    const j = renderJoin("G-inner-join");
    await advanceUntil(() => j.completes() > 0, 60000);
    const done = qa(j.container, "path[data-status='done']");
    expect(done.length).toBeGreaterThan(0);
    for (const p of done) expect(Number(p.getAttribute("opacity") ?? p.style.opacity)).toBeCloseTo(0.2, 1);
  });

  it("one-to-many: fans out and summarises 'N matches'", async () => {
    const j = renderJoin("I-one-to-many");
    let fan = false;
    let summary = false;
    await advanceUntil(() => {
      const msg = q(j.container, "[data-join-lane-message]")?.textContent ?? "";
      if (/^\d+ matches$/.test(msg)) summary = true;
      if (/match 2 of 2/.test(j.container.textContent ?? "")) fan = true;
      return j.completes() > 0;
    }, 60000, 20);
    expect(fan).toBe(true);
    expect(summary).toBe(true);
    expectSettledMatchesSnapshot(j.container, j.snapshot);
  });

  it("LEFT JOIN: unmatched row shows a dashed stub and 'No match → NULL'", async () => {
    const j = renderJoin("H-left-join");
    let noMatch = false;
    let dashed = false;
    await advanceUntil(() => {
      if (q(j.container, "[data-join-lane-message]")?.textContent === "No match → NULL") noMatch = true;
      if (qa(j.container, "path[data-arrow-key*='->null']").some((p) => p.getAttribute("stroke-dasharray") === "4 3")) dashed = true;
      return j.completes() > 0;
    }, 60000, 20);
    expect(noMatch).toBe(true);
    expect(dashed).toBe(true);
    expectSettledMatchesSnapshot(j.container, j.snapshot);
    expect(j.snapshot.rows.some((r) => Object.values(r).includes(null))).toBe(true);
  });

  it("R.8 completion callback fires exactly once", async () => {
    const j = renderJoin("I-one-to-many");
    await advanceUntil(() => j.completes() > 0, 60000);
    await advance(10000);
    expect(j.completes()).toBe(1);
  });

  it("R.9 pausing freezes connector drawing", async () => {
    const j = renderJoin("G-inner-join");
    const isDraw = (r: (typeof recorded)[number]) => r.keyframes.some((k) => "strokeDashoffset" in k);
    await advanceUntil(() => recorded.some((r) => isDraw(r) && r.anim.playState === "running"), 20000, 10);
    await advance(100);
    const draw = recorded.find((r) => isDraw(r) && r.anim.playState === "running")!;
    expect(draw).toBeDefined();
    j.update({ paused: true });
    await advance(1);
    const t = draw.anim.currentTime;
    const html = j.container.innerHTML;
    await advance(10000);
    expect(draw.anim.currentTime).toBe(t);
    expect(draw.anim.playState).toBe("paused");
    expect(j.container.innerHTML).toBe(html);
    expect(j.completes()).toBe(0);
    j.update({ paused: false });
    await advanceUntil(() => j.completes() > 0, 60000);
    expectSettledMatchesSnapshot(j.container, j.snapshot);
  });

  it("R.14 resize re-measures anchors (no stale coordinates)", async () => {
    const j = renderJoin("G-inner-join");
    await advanceUntil(() => j.completes() > 0, 60000);
    const path = q(j.container, "path[data-status='done']")!;
    const before = path.getAttribute("d");
    setGeometryScale(2);
    await advance(0);
    const { act } = await import("@testing-library/react");
    act(() => triggerResize());
    const after = q(j.container, `path[data-arrow-key="${path.getAttribute("data-arrow-key")}"]`)!.getAttribute("d");
    expect(after).not.toBe(before);
  });
});
