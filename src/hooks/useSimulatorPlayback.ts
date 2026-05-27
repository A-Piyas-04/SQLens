import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;
export type TransitionPhase =
  | "idle"
  | "departing"
  | "transforming"
  | "arriving"
  | "settled";

/** ms each stage is held before auto-advancing */
export const HOLD_MS: Record<PlaybackSpeed, number> = {
  0.5: 5000,
  1: 3000,
  2: 1800,
  4: 900,
};

/** CSS animation duration shrinks at high speeds so rows finish before advance */
export const ANIM_MS: Record<PlaybackSpeed, number> = {
  0.5: 1000,
  1: 700,
  2: 450,
  4: 260,
};

export const STAGGER_MS: Record<PlaybackSpeed, number> = {
  0.5: 60,
  1: 40,
  2: 25,
  4: 15,
};

export const REMOVE_MS: Record<PlaybackSpeed, number> = {
  0.5: 600,
  1: 400,
  2: 260,
  4: 150,
};

export const ENTRY_MS: Record<PlaybackSpeed, number> = {
  0.5: 500,
  1: 350,
  2: 220,
  4: 130,
};

function debugLog(...args: unknown[]): void {
  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem("simulator:debug") === "1"
  ) {
    console.log("[Simulator Playback]", ...args);
  }
}

export type PlaybackState = {
  activeIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  /** Incremented on every navigation — used as `key` on animated table bodies */
  animationKey: number;
  /** True while React is committing the new stage (marks update as non-urgent) */
  isPending: boolean;
  transitionPhase: TransitionPhase;
  isTransitioning: boolean;
  stepMode: boolean;
  navigate: (newIndex: number) => void;
  setTransitionPhase: (phase: TransitionPhase) => void;
  togglePlay: () => void;
  toggleStepMode: () => void;
  restart: () => void;
  setSpeed: (s: PlaybackSpeed) => void;
};

/**
 * Manages playback state for the simulator visualization canvas.
 *
 * Responsibilities:
 * - Track active stage index and increment animationKey on every change.
 * - Drive auto-advance via setInterval at HOLD_MS[speed].
 * - Stop auto-play when the last stage is reached; restart from 0 if play is
 *   triggered again at the last stage.
 * - Emit debug logs only when localStorage key "simulator:debug" === "1".
 */
export function useSimulatorPlayback(totalStages: number): PlaybackState {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [animationKey, setAnimKey] = useState(0);
  const [transitionPhase, setTransitionPhaseState] = useState<TransitionPhase>("idle");
  const [stepMode, setStepMode] = useState(true);
  const [isPending, startTransition] = useTransition();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTransitioning = transitionPhase !== "idle";

  const setTransitionPhase = useCallback((phase: TransitionPhase) => {
    setTransitionPhaseState(phase);
  }, []);

  // Stable navigate so it can be called from effects and event handlers
  const navigate = useCallback(
    (newIndex: number) => {
      if (isTransitioning) return;
      const clamped = Math.max(0, Math.min(totalStages - 1, newIndex));
      debugLog("navigate →", clamped, "speed:", speed);
      setAnimKey((k) => k + 1);
      setTransitionPhaseState("idle");
      startTransition(() => setActiveIndex(clamped));
    },
    [isTransitioning, totalStages, speed, startTransition]
  );

  const togglePlay = useCallback(() => {
    if (stepMode) {
      navigate(activeIndex + 1);
      return;
    }
    setIsPlaying((playing) => {
      if (playing) {
        debugLog("pause");
        return false;
      }
      // If sitting at the last stage, rewind first
      setActiveIndex((i) => {
        if (i >= totalStages - 1) {
          debugLog("restart from end");
          setAnimKey((k) => k + 1);
          return 0;
        }
        return i;
      });
      debugLog("play");
      return true;
    });
  }, [activeIndex, navigate, stepMode, totalStages]);

  const restart = useCallback(() => {
    debugLog("restart");
    setIsPlaying(false);
    setAnimKey((k) => k + 1);
    setTransitionPhaseState("idle");
    startTransition(() => setActiveIndex(0));
  }, [startTransition]);

  const toggleStepMode = useCallback(() => {
    setStepMode((prev) => {
      const next = !prev;
      if (next) setIsPlaying(false);
      return next;
    });
  }, []);

  const setSpeed = useCallback((s: PlaybackSpeed) => {
    debugLog("speed →", s);
    setSpeedState(s);
  }, []);

  // ── Auto-advance interval ────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (stepMode) return;
    intervalRef.current = setInterval(() => {
      if (transitionPhase !== "idle") return;
      setActiveIndex((i) => {
        const next = i + 1;
        if (next >= totalStages) {
          debugLog("auto-play finished at last stage");
          setIsPlaying(false);
          return i;
        }
        debugLog("auto-advance →", next);
        setAnimKey((k) => k + 1);
        return next;
      });
    }, HOLD_MS[speed]);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, stepMode, totalStages, transitionPhase]);

  // ── Reset when a new simulation result arrives ───────────────────────────
  useEffect(() => {
    debugLog("new simulation — reset to stage 0");
    setIsPlaying(false);
    setAnimKey((k) => k + 1);
    setTransitionPhaseState("idle");
    startTransition(() => setActiveIndex(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalStages]);

  return {
    activeIndex,
    isPlaying,
    speed,
    animationKey,
    isPending,
    transitionPhase,
    isTransitioning,
    stepMode,
    navigate,
    setTransitionPhase,
    togglePlay,
    toggleStepMode,
    restart,
    setSpeed,
  };
}
