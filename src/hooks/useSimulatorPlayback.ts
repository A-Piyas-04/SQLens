import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

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
  navigate: (newIndex: number) => void;
  togglePlay: () => void;
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
  const [isPending, startTransition] = useTransition();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable navigate so it can be called from effects and event handlers
  const navigate = useCallback(
    (newIndex: number) => {
      const clamped = Math.max(0, Math.min(totalStages - 1, newIndex));
      debugLog("navigate →", clamped, "speed:", speed);
      setAnimKey((k) => k + 1);
      startTransition(() => setActiveIndex(clamped));
    },
    [totalStages, speed, startTransition]
  );

  const togglePlay = useCallback(() => {
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
  }, [totalStages]);

  const restart = useCallback(() => {
    debugLog("restart");
    setIsPlaying(false);
    setAnimKey((k) => k + 1);
    startTransition(() => setActiveIndex(0));
  }, [startTransition]);

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

    intervalRef.current = setInterval(() => {
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
  }, [isPlaying, speed, totalStages]);

  // ── Reset when a new simulation result arrives ───────────────────────────
  useEffect(() => {
    debugLog("new simulation — reset to stage 0");
    setIsPlaying(false);
    setAnimKey((k) => k + 1);
    startTransition(() => setActiveIndex(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalStages]);

  return {
    activeIndex,
    isPlaying,
    speed,
    animationKey,
    isPending,
    navigate,
    togglePlay,
    restart,
    setSpeed,
  };
}
