import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StageAnimationController } from "../StageAnimationController";
import { TimerAnimation } from "../TimerAnimation";
import type { AnimationState, PlaybackPhase } from "../stageAnimationTypes";

const FAKE = [
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "Date",
  "performance",
] as const;

async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
}

function makeController(extra: Partial<ConstructorParameters<typeof StageAnimationController>[0]> = {}) {
  const states: AnimationState[] = [];
  const phases: PlaybackPhase[] = [];
  const ctl = new StageAnimationController({
    label: "test",
    onStateChange: (s) => states.push(s),
    onPhaseChange: (p) => phases.push(p),
    ...extra,
  });
  return { ctl, states, phases };
}

/** Three-phase choreography: each phase is one tracked 100ms animation. */
function threePhase(ctl: StageAnimationController, log: string[] = []) {
  return async () => {
    await ctl.phaseStep("focus", async () => {
      log.push("focus");
      await ctl.waitAll([ctl.track(new TimerAnimation(100))]);
    });
    await ctl.phaseStep("action", async () => {
      log.push("action");
      await ctl.waitAll([ctl.track(new TimerAnimation(100))]);
    });
    await ctl.phaseStep("result", async () => {
      log.push("result");
      await ctl.delay(100);
    });
  };
}

describe("TimerAnimation", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: [...FAKE] }));
  afterEach(() => vi.useRealTimers());

  it("finishes after its duration", async () => {
    const a = new TimerAnimation(200);
    const done = vi.fn();
    a.finished.then(done);
    await advance(199);
    expect(done).not.toHaveBeenCalled();
    await advance(2);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("pause freezes and resume continues from the current time", async () => {
    const a = new TimerAnimation(200);
    const done = vi.fn();
    a.finished.then(done);
    await advance(120);
    a.pause();
    expect(a.currentTime).toBeCloseTo(120, 0);
    await advance(1000);
    expect(done).not.toHaveBeenCalled();
    expect(a.currentTime).toBeCloseTo(120, 0);
    a.play();
    await advance(79);
    expect(done).not.toHaveBeenCalled();
    await advance(2);
    expect(done).toHaveBeenCalled();
  });

  it("playbackRate change keeps progress (no restart)", async () => {
    const a = new TimerAnimation(400);
    const done = vi.fn();
    a.finished.then(done);
    await advance(200);
    a.playbackRate = 2;
    // remaining 200ms of timeline at 2× = 100ms wall time
    await advance(99);
    expect(done).not.toHaveBeenCalled();
    await advance(2);
    expect(done).toHaveBeenCalled();
  });

  it("cancel rejects finished with AbortError", async () => {
    const a = new TimerAnimation(100);
    const err = a.finished.catch((e: Error) => e.name);
    a.cancel();
    expect(await err).toBe("AbortError");
  });
});

describe("StageAnimationController", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: [...FAKE] }));
  afterEach(() => vi.useRealTimers());

  it("play → complete: runs phases in order and completes exactly once", async () => {
    const { ctl, states, phases } = makeController();
    const log: string[] = [];
    const result = ctl.run(threePhase(ctl, log));
    expect(ctl.isRunning()).toBe(true);
    await advance(350);
    expect(await result).toBe("complete");
    expect(log).toEqual(["focus", "action", "result"]);
    expect(phases).toEqual(["action", "result", "settled"]);
    expect(states.filter((s) => s === "complete")).toHaveLength(1);
    expect(ctl.getPhase()).toBe("settled");
    expect(ctl.isRunning()).toBe(false);
  });

  it("does not complete before the tracked animations finish", async () => {
    const { ctl, states } = makeController();
    void ctl.run(threePhase(ctl));
    await advance(250);
    expect(states).not.toContain("complete");
    await advance(100);
    expect(states).toContain("complete");
  });

  it("play → pause → resume → complete: pause freezes progress and phase", async () => {
    const { ctl, states } = makeController();
    const log: string[] = [];
    const result = ctl.run(threePhase(ctl, log));
    await advance(150); // mid "action"
    ctl.pause();
    expect(ctl.getState()).toBe("paused");
    const phase = ctl.getPhase();
    await advance(5000);
    expect(ctl.getPhase()).toBe(phase);
    expect(log).toEqual(["focus", "action"]);
    expect(states).not.toContain("complete");
    ctl.resume();
    expect(ctl.getState()).toBe("running");
    await advance(149);
    expect(states).not.toContain("complete");
    await advance(5);
    expect(await result).toBe("complete");
  });

  it("play → cancel: run resolves cancelled and never reports complete", async () => {
    const { ctl, states } = makeController();
    const result = ctl.run(threePhase(ctl));
    await advance(50);
    ctl.cancel({ silent: true });
    expect(await result).toBe("cancelled");
    await advance(1000);
    expect(states).not.toContain("complete");
    expect(ctl.activeCount()).toBe(0);
  });

  it("1× → 2× speed changes the active animation rate without restarting", async () => {
    const { ctl, states } = makeController();
    const result = ctl.run(async () => {
      await ctl.waitAll([ctl.track(new TimerAnimation(400))]);
    });
    await advance(200);
    ctl.setPlaybackRate(2);
    expect(ctl.getPlaybackRate()).toBe(2);
    await advance(99);
    expect(states).not.toContain("complete");
    await advance(3);
    expect(await result).toBe("complete");
  });

  it("future animations inherit the current rate", async () => {
    const { ctl } = makeController({ rate: 4 });
    const a = ctl.track(new TimerAnimation(400));
    expect(a.playbackRate).toBe(4);
    const done = vi.fn();
    a.finished.then(done);
    await advance(101);
    expect(done).toHaveBeenCalled();
  });

  it("play → navigate: previous stage cancelled, next stage completes alone", async () => {
    const first = makeController();
    const second = makeController();
    const r1 = first.ctl.run(threePhase(first.ctl));
    await advance(120);
    first.ctl.cancel({ silent: true });
    const r2 = second.ctl.run(threePhase(second.ctl));
    await advance(400);
    expect(await r1).toBe("cancelled");
    expect(await r2).toBe("complete");
    expect(first.states).not.toContain("complete");
    expect(second.states.filter((s) => s === "complete")).toHaveLength(1);
  });

  it("skip jumps current and future animations to the end", async () => {
    const { ctl } = makeController();
    const result = ctl.run(threePhase(ctl));
    await advance(10);
    ctl.skip();
    await advance(1);
    expect(await result).toBe("complete");
  });

  it("skip while paused completes immediately", async () => {
    const { ctl } = makeController();
    const result = ctl.run(threePhase(ctl));
    await advance(10);
    ctl.pause();
    ctl.skip();
    await advance(1);
    expect(await result).toBe("complete");
  });

  it("reduced-motion flag is exposed to choreographies", () => {
    const { ctl } = makeController({ reducedMotion: true });
    expect(ctl.reducedMotion).toBe(true);
  });

  it("a throwing choreography still settles as complete (never strands autoplay)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { ctl, states } = makeController();
    const result = await ctl.run(async () => {
      throw new Error("boom");
    });
    expect(result).toBe("complete");
    expect(states).toContain("complete");
    spy.mockRestore();
  });

  it("keepFill animations are released when the stage settles", async () => {
    const { ctl } = makeController();
    const filled = ctl.track(new TimerAnimation(50), true);
    const cancelSpy = vi.spyOn(filled, "cancel");
    const result = ctl.run(async () => {
      await ctl.waitAll([filled]);
    });
    await advance(60);
    expect(await result).toBe("complete");
    expect(cancelSpy).toHaveBeenCalled();
  });

  it("delay is pausable", async () => {
    const { ctl } = makeController();
    const done = vi.fn();
    void ctl.run(() => ctl.delay(100)).then(done);
    await advance(50);
    ctl.pause();
    await advance(1000);
    expect(done).not.toHaveBeenCalled();
    ctl.resume();
    await advance(55);
    expect(done).toHaveBeenCalledWith("complete");
  });
});
