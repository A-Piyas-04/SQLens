import type { AnimationLike } from "./stageAnimationTypes";
import { now } from "./playbackDebug";

function abortError(): Error {
  const err = new Error("Animation cancelled");
  err.name = "AbortError";
  return err;
}

/**
 * A pausable, rate-aware timeline segment with the same surface as a WAAPI
 * `Animation`. Used for deliberate holds between visual steps and as the
 * stand-in for `element.animate()` where WAAPI is unavailable (jsdom).
 */
export class TimerAnimation implements AnimationLike {
  readonly finished: Promise<void>;
  private resolveFn!: () => void;
  private rejectFn!: (e: Error) => void;
  private rate = 1;
  private elapsed = 0;
  private lastStart = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private state: "running" | "paused" | "finished" | "idle" = "idle";
  private readonly durationMs: number;

  constructor(durationMs: number, autoplay = true) {
    this.durationMs = Math.max(0, durationMs);
    this.finished = new Promise<void>((resolve, reject) => {
      this.resolveFn = resolve;
      this.rejectFn = reject;
    });
    // Callers that never await `finished` must not trigger unhandled rejections.
    this.finished.catch(() => undefined);
    if (autoplay) this.play();
  }

  get playState(): string {
    return this.state;
  }

  get playbackRate(): number {
    return this.rate;
  }

  set playbackRate(next: number) {
    if (this.state === "running") {
      this.elapsed += (now() - this.lastStart) * this.rate;
      this.lastStart = now();
      this.rate = next;
      this.schedule();
    } else {
      this.rate = next;
    }
  }

  updatePlaybackRate(next: number): void {
    this.playbackRate = next;
  }

  /** Elapsed timeline time in ms (at 1× scale). */
  get currentTime(): number {
    if (this.state === "running") {
      return this.elapsed + (now() - this.lastStart) * this.rate;
    }
    return this.elapsed;
  }

  play(): void {
    if (this.state === "running" || this.state === "finished") return;
    this.state = "running";
    this.lastStart = now();
    this.schedule();
  }

  pause(): void {
    if (this.state !== "running") return;
    this.elapsed += (now() - this.lastStart) * this.rate;
    this.state = "paused";
    this.clear();
  }

  finish(): void {
    if (this.state === "finished") return;
    this.clear();
    this.elapsed = this.durationMs;
    this.state = "finished";
    this.resolveFn();
  }

  cancel(): void {
    if (this.state === "finished") return;
    this.clear();
    this.state = "finished";
    this.rejectFn(abortError());
  }

  reverse(): void {
    this.elapsed = Math.max(0, this.durationMs - this.currentTime);
    if (this.state === "running") {
      this.lastStart = now();
      this.schedule();
    }
  }

  private schedule(): void {
    this.clear();
    const remaining = (this.durationMs - this.elapsed) / Math.max(this.rate, 0.0001);
    this.timer = setTimeout(() => this.finish(), Math.max(0, remaining));
  }

  private clear(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
