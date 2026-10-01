import type { AnimationLike, AnimationState, PlaybackPhase } from "./stageAnimationTypes";
import { TimerAnimation } from "./TimerAnimation";
import { now, playbackDebug } from "./playbackDebug";

/** Thrown inside a stage run after `cancel()`; swallowed by `run()`. */
export class StageCancelledError extends Error {
  constructor() {
    super("Stage animation cancelled");
    this.name = "StageCancelledError";
  }
}

type ControllerOptions = {
  label?: string;
  rate?: number;
  reducedMotion?: boolean;
  onStateChange?: (state: AnimationState) => void;
  onPhaseChange?: (phase: PlaybackPhase) => void;
  /** Factory for timeline holds; injectable for tests. */
  createTimer?: (ms: number) => AnimationLike;
};

export type RunResult = "complete" | "cancelled";

/**
 * Single source of truth for one stage's playback timeline.
 *
 * Every visual step registers its `Animation` via `track()`. Phase completion
 * is `await`ed on `animation.finished`, never on a guessed timeout. Pause,
 * resume, speed and cancel are applied to every active animation at once.
 */
export class StageAnimationController {
  readonly label: string;
  readonly reducedMotion: boolean;
  private readonly active = new Set<AnimationLike>();
  private readonly filled = new Set<AnimationLike>();
  private readonly onStateChange?: (state: AnimationState) => void;
  private readonly onPhaseChange?: (phase: PlaybackPhase) => void;
  private readonly createTimer: (ms: number) => AnimationLike;
  private rate: number;
  private phase: PlaybackPhase = "focus";
  private state: AnimationState = "idle";
  private cancelled = false;
  private paused = false;
  private skipping = false;
  private completed = false;
  private animationCount = 0;
  private runStart = 0;

  constructor(options: ControllerOptions = {}) {
    this.label = options.label ?? "stage";
    this.rate = options.rate ?? 1;
    this.reducedMotion = options.reducedMotion ?? false;
    this.onStateChange = options.onStateChange;
    this.onPhaseChange = options.onPhaseChange;
    this.createTimer = options.createTimer ?? ((ms) => new TimerAnimation(ms));
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  getPhase(): PlaybackPhase {
    return this.phase;
  }

  getState(): AnimationState {
    return this.state;
  }

  getPlaybackRate(): number {
    return this.rate;
  }

  isRunning(): boolean {
    return this.state === "running" || this.state === "paused";
  }

  isCancelled(): boolean {
    return this.cancelled;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isSkipping(): boolean {
    return this.skipping;
  }

  activeCount(): number {
    return this.active.size;
  }

  // ── Running a stage ───────────────────────────────────────────────────────

  /**
   * Runs a stage choreography. Resolves "complete" exactly once when every
   * phase has finished, or "cancelled" if `cancel()` interrupted it.
   */
  async run(choreography: (ctl: this) => Promise<void>): Promise<RunResult> {
    if (this.cancelled) return "cancelled";
    this.runStart = now();
    this.setState(this.paused ? "paused" : "running");
    playbackDebug("stage enter", { stage: this.label, rate: this.rate });
    try {
      await choreography(this);
      this.throwIfCancelled();
    } catch (err) {
      if (this.cancelled || err instanceof StageCancelledError) {
        return "cancelled";
      }
      // A broken animation must never strand autoplay; settle and report.
      console.error("[Simulator Playback] stage animation failed", err);
    }
    if (this.cancelled) return "cancelled";
    this.releaseFills();
    this.setPhase("settled");
    if (!this.completed) {
      this.completed = true;
      this.setState("complete");
      playbackDebug("animation count", { stage: this.label, count: this.animationCount });
      playbackDebug("stage complete", {
        stage: this.label,
        durationMs: Math.round(now() - this.runStart),
      });
    }
    return "complete";
  }

  /** Runs one named phase and awaits it. */
  async phaseStep(phase: PlaybackPhase, body: () => Promise<void> | void): Promise<void> {
    this.throwIfCancelled();
    this.setPhase(phase);
    const start = now();
    playbackDebug("phase start", { stage: this.label, phase });
    await body();
    this.throwIfCancelled();
    playbackDebug("phase complete", {
      stage: this.label,
      phase,
      durationMs: Math.round(now() - start),
    });
  }

  /**
   * Registers an animation with the timeline. Applies current rate, pause and
   * skip state. `keepFill` animations are cancelled when the stage settles so
   * no transform/opacity is left behind.
   */
  track<T extends AnimationLike>(animation: T, keepFill = false): T {
    if (this.cancelled) {
      animation.cancel();
      return animation;
    }
    this.animationCount += 1;
    this.applyRate(animation, this.rate);
    this.active.add(animation);
    if (keepFill) this.filled.add(animation);
    const done = () => this.active.delete(animation);
    animation.finished.then(done, done);
    if (this.skipping) animation.finish();
    else if (this.paused) animation.pause();
    return animation;
  }

  /** Awaits every given animation; throws if the stage was cancelled meanwhile. */
  async waitAll(animations: Array<AnimationLike | null | undefined>): Promise<void> {
    const list = animations.filter((a): a is AnimationLike => a != null);
    await Promise.all(list.map((a) => a.finished.catch(() => undefined)));
    this.throwIfCancelled();
  }

  /** A deliberate, pausable, speed-aware hold on the stage timeline. */
  async delay(ms: number): Promise<void> {
    this.throwIfCancelled();
    if (ms <= 0) return;
    const timer = this.track(this.createTimer(ms));
    await this.waitAll([timer]);
  }

  /** Waits for the next animation frame (or a microtask without rAF). */
  async nextFrame(): Promise<void> {
    await new Promise<void>((resolve) => {
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
      else queueMicrotask(resolve);
    });
    this.throwIfCancelled();
  }

  throwIfCancelled(): void {
    if (this.cancelled) throw new StageCancelledError();
  }

  // ── Transport controls ────────────────────────────────────────────────────

  play(): void {
    this.resume();
  }

  pause(): void {
    if (this.paused || this.cancelled) return;
    this.paused = true;
    for (const a of this.active) a.pause();
    if (this.state === "running") this.setState("paused");
    playbackDebug("pause", { stage: this.label, active: this.active.size });
  }

  resume(): void {
    if (!this.paused || this.cancelled) return;
    this.paused = false;
    for (const a of this.active) a.play();
    if (this.state === "paused") this.setState("running");
    playbackDebug("resume", { stage: this.label, active: this.active.size });
  }

  setPlaybackRate(rate: number): void {
    if (rate === this.rate) return;
    this.rate = rate;
    for (const a of this.active) this.applyRate(a, rate);
    playbackDebug("speed", { stage: this.label, rate });
  }

  /** Jumps every current and future animation of this stage to its end. */
  skip(): void {
    if (this.cancelled || this.completed) return;
    this.skipping = true;
    if (this.paused) this.resume();
    for (const a of [...this.active]) a.finish();
    playbackDebug("skip", { stage: this.label });
  }

  /** Reverses every active animation and awaits them. */
  async reverse(): Promise<void> {
    const list = [...this.active];
    for (const a of list) a.reverse();
    playbackDebug("reverse", { stage: this.label, active: list.length });
    await Promise.all(list.map((a) => a.finished.catch(() => undefined)));
  }

  /**
   * Cancels all animations; the running choreography rejects internally and
   * `run()` resolves "cancelled" with no completion side effects.
   */
  cancel({ silent = false }: { silent?: boolean } = {}): void {
    if (this.cancelled) return;
    this.cancelled = true;
    for (const a of [...this.active]) a.cancel();
    this.releaseFills();
    this.active.clear();
    playbackDebug("cancel", { stage: this.label, silent });
    if (!silent && !this.completed) this.setState("idle");
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private releaseFills(): void {
    for (const a of this.filled) {
      try {
        a.cancel();
      } catch {
        /* element may be detached */
      }
    }
    this.filled.clear();
  }

  private applyRate(a: AnimationLike, rate: number): void {
    if (typeof a.updatePlaybackRate === "function") a.updatePlaybackRate(rate);
    else a.playbackRate = rate;
  }

  private setPhase(phase: PlaybackPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.onPhaseChange?.(phase);
  }

  private setState(state: AnimationState): void {
    if (this.state === state) return;
    this.state = state;
    this.onStateChange?.(state);
  }
}
