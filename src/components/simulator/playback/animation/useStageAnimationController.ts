import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AnimationState } from "./stageAnimationTypes";
import { StageAnimationController } from "./StageAnimationController";
import { prefersReducedMotion } from "./motion";

/** Tracks `prefers-reduced-motion` live. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

type Options = {
  /** Changes whenever a new stage run should start (navigation, replay). */
  runKey: string | number;
  label: string;
  speed: number;
  paused: boolean;
  skipToken: number;
  reducedMotion: boolean;
  /** Reports carry the run key so stale runs can be ignored upstream. */
  onStateChange: (state: AnimationState, runKey: string | number) => void;
  run: (ctl: StageAnimationController) => Promise<void>;
};

/**
 * Owns one `StageAnimationController` per stage run. A new `runKey` cancels
 * the previous run (no stale animations, no completion side effects) before
 * the next one starts; unmount cancels silently.
 */
export function useStageAnimationController({
  runKey,
  label,
  speed,
  paused,
  skipToken,
  reducedMotion,
  onStateChange,
  run,
}: Options) {
  const ctlRef = useRef<StageAnimationController | null>(null);
  const latest = useRef({ speed, paused, reducedMotion, onStateChange, run, label });
  latest.current = { speed, paused, reducedMotion, onStateChange, run, label };

  // Layout effect + microtask: the first view commit lands before paint, so a
  // new stage never flashes the previous stage's DOM.
  useLayoutEffect(() => {
    const opts = latest.current;
    const ctl = new StageAnimationController({
      label: opts.label,
      rate: opts.speed,
      reducedMotion: opts.reducedMotion,
      onStateChange: (s) => latest.current.onStateChange(s, runKey),
    });
    if (opts.paused) ctl.pause();
    ctlRef.current = ctl;
    let disposed = false;

    // Start after the commit so flushSync-based view commits are legal.
    queueMicrotask(() => {
      if (disposed) return;
      void ctl.run(() => latest.current.run(ctl));
    });

    return () => {
      disposed = true;
      ctl.cancel({ silent: true });
      if (ctlRef.current === ctl) ctlRef.current = null;
    };
  }, [runKey]);

  useEffect(() => {
    ctlRef.current?.setPlaybackRate(speed);
  }, [speed]);

  useEffect(() => {
    const ctl = ctlRef.current;
    if (!ctl) return;
    if (paused) ctl.pause();
    else ctl.resume();
  }, [paused]);

  const lastSkip = useRef(skipToken);
  useEffect(() => {
    if (skipToken === lastSkip.current) return;
    lastSkip.current = skipToken;
    ctlRef.current?.skip();
  }, [skipToken]);

  return ctlRef;
}
