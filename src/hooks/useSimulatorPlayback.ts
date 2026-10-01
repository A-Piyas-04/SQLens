import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnimationState,
  PlaybackDirection,
} from "../components/simulator/playback/animation/stageAnimationTypes";
import { playbackDebug } from "../components/simulator/playback/animation/playbackDebug";

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/**
 * Reading time after a stage has *finished* animating, before autoplay moves
 * on. This is a dwell, not an animation-completion guess.
 */
export const DWELL_MS: Record<PlaybackSpeed, number> = {
  0.5: 2400,
  1: 1400,
  2: 800,
  4: 350,
};

export type PlaybackState = {
  activeIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  /** Incremented on every navigation / replay — starts a new stage run. */
  runKey: number;
  direction: PlaybackDirection;
  /** |new − old| stage index of the last navigation (0 = re-layout). */
  distance: number;
  animationState: AnimationState;
  /** User paused an in-flight animation. */
  animationPaused: boolean;
  skipToken: number;
  stepMode: boolean;
  focusOnChanges: boolean;
  navigate: (newIndex: number) => void;
  togglePlay: () => void;
  toggleStepMode: () => void;
  restart: () => void;
  replay: () => void;
  skip: () => void;
  setSpeed: (s: PlaybackSpeed) => void;
  toggleFocusOnChanges: () => void;
  reportAnimationState: (s: AnimationState, runKey: number) => void;
};

const FOCUS_KEY = "simulator:focusOnChanges";

function readFocusPref(): boolean {
  try {
    return localStorage.getItem(FOCUS_KEY) !== "0";
  } catch {
    return true;
  }
}

/**
 * Playback state for the simulator visualisation.
 *
 * - Autoplay advances only when the stage animation reports "complete", the
 *   user has not paused, and there is a next stage.
 * - Navigation is always allowed; the stage host cancels the active animation.
 * - Space pauses/resumes an in-flight animation; otherwise it steps (step
 *   mode) or toggles autoplay.
 */
export function useSimulatorPlayback(totalStages: number): PlaybackState {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [runKey, setRunKey] = useState(0);
  const [direction, setDirection] = useState<PlaybackDirection>("forward");
  const [distance, setDistance] = useState(1);
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const [animationPaused, setAnimationPaused] = useState(false);
  const [skipToken, setSkipToken] = useState(0);
  const [stepMode, setStepMode] = useState(true);
  const [focusOnChanges, setFocusOnChanges] = useState(readFocusPref);

  const stateRef = useRef({ activeIndex, animationState, totalStages });
  stateRef.current = { activeIndex, animationState, totalStages };

  // Updated synchronously so a stale run's late report is rejected even
  // before React re-renders with the new key.
  const runKeyRef = useRef(runKey);
  const bumpRunKey = useCallback(() => {
    runKeyRef.current += 1;
    setRunKey(runKeyRef.current);
  }, []);

  const startRun = useCallback(
    (index: number, dir: PlaybackDirection, dist: number) => {
      setDirection(dir);
      setDistance(dist);
      setAnimationPaused(false);
      setAnimationState("idle");
      setActiveIndex(index);
      bumpRunKey();
    },
    [bumpRunKey]
  );

  const navigate = useCallback(
    (newIndex: number) => {
      const { activeIndex: current, animationState: anim, totalStages: total } = stateRef.current;
      const clamped = Math.max(0, Math.min(total - 1, newIndex));
      if (clamped === current) return;
      if (anim === "running" || anim === "paused") {
        playbackDebug("navigation interruption", { from: current, to: clamped });
      }
      playbackDebug("navigate", { from: current, to: clamped });
      startRun(clamped, clamped < current ? "backward" : "forward", Math.abs(clamped - current));
    },
    [startRun]
  );

  const togglePlay = useCallback(() => {
    const { activeIndex: current, animationState: anim, totalStages: total } = stateRef.current;
    if (anim === "running") {
      setAnimationPaused(true);
      setIsPlaying(false);
      return;
    }
    if (anim === "paused") {
      setAnimationPaused(false);
      if (!stepMode) setIsPlaying(true);
      return;
    }
    if (stepMode) {
      navigate(current + 1);
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (current >= total - 1) {
      playbackDebug("navigate", { from: current, to: 0, reason: "restart from end" });
      startRun(0, "forward", 1);
    }
    setIsPlaying(true);
  }, [isPlaying, navigate, startRun, stepMode]);

  const restart = useCallback(() => {
    setIsPlaying(false);
    startRun(0, "forward", 1);
  }, [startRun]);

  const replay = useCallback(() => {
    playbackDebug("replay", { stage: stateRef.current.activeIndex });
    startRun(stateRef.current.activeIndex, "forward", 1);
  }, [startRun]);

  const skip = useCallback(() => {
    setAnimationPaused(false);
    setSkipToken((t) => t + 1);
  }, []);

  const toggleStepMode = useCallback(() => {
    setStepMode((prev) => {
      const next = !prev;
      if (next) setIsPlaying(false);
      return next;
    });
  }, []);

  const setSpeed = useCallback((s: PlaybackSpeed) => {
    playbackDebug("speed", { speed: s });
    setSpeedState(s);
  }, []);

  const toggleFocusOnChanges = useCallback(() => {
    setFocusOnChanges((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(FOCUS_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
    // Re-layout the current stage to its settled state with the new policy.
    setDirection("forward");
    setDistance(0);
    bumpRunKey();
  }, [bumpRunKey]);

  const reportAnimationState = useCallback((s: AnimationState, fromRunKey: number) => {
    if (fromRunKey !== runKeyRef.current) return;
    setAnimationState(s);
  }, []);

  // ── Autoplay: advance only after the stage animation completes ───────────
  useEffect(() => {
    if (!isPlaying || stepMode || animationPaused || animationState !== "complete") return;
    if (activeIndex >= totalStages - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      playbackDebug("autoplay advance", { from: activeIndex, to: activeIndex + 1 });
      startRun(activeIndex + 1, "forward", 1);
    }, DWELL_MS[speed]);
    return () => clearTimeout(timer);
  }, [isPlaying, stepMode, animationPaused, animationState, activeIndex, totalStages, speed, startRun]);

  // ── Reset when a new simulation result arrives ───────────────────────────
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setIsPlaying(false);
    startRun(0, "forward", 1);
  }, [totalStages, startRun]);

  return {
    activeIndex,
    isPlaying,
    speed,
    runKey,
    direction,
    distance,
    animationState,
    animationPaused,
    skipToken,
    stepMode,
    focusOnChanges,
    navigate,
    togglePlay,
    toggleStepMode,
    restart,
    replay,
    skip,
    setSpeed,
    toggleFocusOnChanges,
    reportAnimationState,
  };
}
