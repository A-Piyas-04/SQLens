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
    <div className="flex flex-col gap-0 border-t border-line bg-surface-raised">
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
                  : "bg-surface-muted/70"
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
            "flex size-8 items-center justify-center rounded-sm border transition-colors",
            isFirst
              ? "border-line text-ink-muted cursor-default"
              : "border-line bg-surface-muted text-ink-secondary hover:bg-surface-muted"
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        {/* Play / Pause */}
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
          className="flex size-9 items-center justify-center rounded-sm border border-accent bg-accent-muted text-accent-ink transition-colors hover:bg-accent-muted hover:text-accent-ink"
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
          className="flex size-8 items-center justify-center rounded-sm border border-line bg-surface-muted text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink-secondary"
        >
          {stepMode ? <Play className="size-3.5" aria-hidden /> : <FastForward className="size-3.5" aria-hidden />}
        </button>

        {/* → Next */}
        <button
          aria-label="Next stage"
          disabled={isLast || isTransitioning}
          onClick={() => navigate(activeIndex + 1)}
          className={cn(
            "flex size-8 items-center justify-center rounded-sm border transition-colors",
            isLast
              ? "border-line text-ink-muted cursor-default"
              : "border-line bg-surface-muted text-ink-secondary hover:bg-surface-muted"
          )}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>

        {/* Stage counter */}
        <span className="ml-1 inline-flex items-center gap-1 text-xs tabular-nums text-ink-muted">
          <span className={cn("inline-block size-2 rounded-full", stageColor.dot)} />
          Stage{" "}
          <span className="font-semibold text-ink-secondary">{activeIndex + 1}</span>
          {" "}of{" "}
          <span className="font-semibold text-ink-secondary">{totalStages}</span>:{" "}
          <span className="font-semibold text-ink-secondary">{activeStageType}</span>
        </span>

        {/* Speed selector */}
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 text-[10px] text-ink-muted">Speed</span>
          <div className="flex rounded-sm border border-line overflow-hidden">
            {SPEEDS.map((s) => (
              <button
                key={s}
                aria-label={`${speedLabels[s]} speed`}
                aria-pressed={speed === s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  speed === s
                    ? "bg-accent-muted text-accent-ink"
                    : "bg-transparent text-ink-muted hover:text-ink-secondary hover:bg-surface-muted"
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
