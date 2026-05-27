import {
  ChevronLeft,
  ChevronRight,
  FastForward,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import {
  type PlaybackSpeed,
  type PlaybackState,
} from "../../../hooks/useSimulatorPlayback";
import type { SimulatorStageType } from "../../../lib/simulator";
import { STAGE_COLORS } from "../stageConstants";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];

type Props = Pick<
  PlaybackState,
  | "activeIndex"
  | "isPlaying"
  | "speed"
  | "navigate"
  | "togglePlay"
  | "setSpeed"
  | "toggleStepMode"
  | "stepMode"
> & {
  totalStages: number;
  isTransitioning: boolean;
  activeStageType: SimulatorStageType;
  stageTypes: SimulatorStageType[];
};

export default function PlaybackControls({
  activeIndex,
  isPlaying,
  speed,
  navigate,
  togglePlay,
  setSpeed,
  toggleStepMode,
  stepMode,
  isTransitioning,
  activeStageType,
  stageTypes,
  totalStages,
}: Props) {
  const isFirst = activeIndex === 0;
  const isLast  = activeIndex >= totalStages - 1;
  const stageColor = STAGE_COLORS[activeStageType];
  const speedLabels: Record<PlaybackSpeed, string> = {
    0.5: "Slow",
    1: "Normal",
    2: "Fast",
    4: "Skip",
  };

  return (
    <div className="flex flex-col gap-0 border-t border-slate-700/50 bg-slate-900/80">
      <div
        className="grid gap-1 px-3 pt-2"
        style={{ gridTemplateColumns: `repeat(${Math.max(totalStages, 1)}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalStages }).map((_, index) => {
          const segmentColor = STAGE_COLORS[stageTypes[index] ?? activeStageType].dot;
          return (
          <div
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index < activeIndex
                ? segmentColor
                : index === activeIndex
                  ? cn(segmentColor, "animate-pulse")
                  : "bg-slate-700/70"
            )}
          />
        );})}
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* ← Prev */}
        <button
          aria-label="Previous stage"
          disabled={isFirst || isTransitioning}
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

        {/* Step mode */}
        <button
          aria-label="Toggle step mode"
          onClick={toggleStepMode}
          className="flex size-8 items-center justify-center rounded-md border border-slate-700/60 bg-slate-800/50 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-300"
        >
          {stepMode ? <Play className="size-3.5" aria-hidden /> : <FastForward className="size-3.5" aria-hidden />}
        </button>

        {/* → Next */}
        <button
          aria-label="Next stage"
          disabled={isLast || isTransitioning}
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
        <span className="ml-1 inline-flex items-center gap-1 text-xs tabular-nums text-slate-500">
          <span className={cn("inline-block size-2 rounded-full", stageColor.dot)} />
          Stage{" "}
          <span className="font-semibold text-slate-300">{activeIndex + 1}</span>
          {" "}of{" "}
          <span className="font-semibold text-slate-300">{totalStages}</span>:{" "}
          <span className="font-semibold text-slate-300">{activeStageType}</span>
        </span>

        {/* Speed selector */}
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 text-[10px] text-slate-500">Speed</span>
          <div className="flex rounded-md border border-slate-700/50 overflow-hidden">
            {SPEEDS.map((s) => (
              <button
                key={s}
                aria-label={`${speedLabels[s]} speed`}
                aria-pressed={speed === s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  speed === s
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                )}
              >
                {speedLabels[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
