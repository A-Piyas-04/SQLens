import { type CSSProperties } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import {
  HOLD_MS,
  type PlaybackSpeed,
  type PlaybackState,
} from "../../../hooks/useSimulatorPlayback";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];

type Props = Pick<
  PlaybackState,
  "activeIndex" | "isPlaying" | "speed" | "animationKey" | "navigate" | "togglePlay" | "restart" | "setSpeed"
> & {
  totalStages: number;
};

export default function PlaybackControls({
  activeIndex,
  isPlaying,
  speed,
  animationKey,
  navigate,
  togglePlay,
  restart,
  setSpeed,
  totalStages,
}: Props) {
  const isFirst = activeIndex === 0;
  const isLast  = activeIndex >= totalStages - 1;

  return (
    <div className="flex flex-col gap-0 border-t border-slate-700/50 bg-slate-900/80">
      {/* Progress bar drain */}
      <div className="h-0.5 w-full overflow-hidden bg-slate-800/60">
        <div
          key={`${activeIndex}-${speed}-${animationKey}`}
          className="pb-progress-bar h-full bg-gradient-to-r from-sky-500/60 to-sky-400/80"
          style={{
            animation: isPlaying
              ? `pb-progress-drain ${HOLD_MS[speed]}ms linear forwards`
              : "none",
            width: isPlaying ? "100%" : "100%",
          } as CSSProperties}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* ← Prev */}
        <button
          aria-label="Previous stage"
          disabled={isFirst}
          onClick={() => navigate(activeIndex - 1)}
          className={cn(
            "flex size-8 items-center justify-center rounded-md border transition-colors",
            isFirst
              ? "border-slate-800 text-slate-700 cursor-default"
              : "border-slate-700/60 bg-slate-800/50 text-slate-300 hover:bg-slate-700/60"
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        {/* Play / Pause */}
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
          className="flex size-9 items-center justify-center rounded-md border border-sky-500/40 bg-sky-500/15 text-sky-300 transition-colors hover:bg-sky-500/25 hover:text-sky-200"
        >
          {isPlaying ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
        </button>

        {/* Restart */}
        <button
          aria-label="Restart"
          onClick={restart}
          className="flex size-8 items-center justify-center rounded-md border border-slate-700/60 bg-slate-800/50 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-300"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </button>

        {/* → Next */}
        <button
          aria-label="Next stage"
          disabled={isLast}
          onClick={() => navigate(activeIndex + 1)}
          className={cn(
            "flex size-8 items-center justify-center rounded-md border transition-colors",
            isLast
              ? "border-slate-800 text-slate-700 cursor-default"
              : "border-slate-700/60 bg-slate-800/50 text-slate-300 hover:bg-slate-700/60"
          )}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>

        {/* Stage counter */}
        <span className="ml-1 text-xs tabular-nums text-slate-500">
          Stage{" "}
          <span className="font-semibold text-slate-300">{activeIndex + 1}</span>
          {" "}of{" "}
          <span className="font-semibold text-slate-300">{totalStages}</span>
        </span>

        {/* Speed selector */}
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 text-[10px] text-slate-500">Speed</span>
          <div className="flex rounded-md border border-slate-700/50 overflow-hidden">
            {SPEEDS.map((s) => (
              <button
                key={s}
                aria-label={`${s}× speed`}
                aria-pressed={speed === s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  speed === s
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
