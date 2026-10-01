import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
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
  | "animationState"
  | "replay"
  | "skip"
  | "focusOnChanges"
  | "toggleFocusOnChanges"
> & {
  totalStages: number;
  activeStageType: SimulatorStageType;
  stageTypes: SimulatorStageType[];
};

const iconBtn =
  "flex size-8 items-center justify-center rounded-sm border border-line bg-surface-muted text-ink-secondary transition-colors hover:text-ink disabled:cursor-default disabled:text-ink-muted disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent";

export default function PlaybackControls({
  activeIndex,
  isPlaying,
  speed,
  navigate,
  togglePlay,
  setSpeed,
  toggleStepMode,
  stepMode,
  animationState,
  replay,
  skip,
  focusOnChanges,
  toggleFocusOnChanges,
  activeStageType,
  stageTypes,
  totalStages,
}: Props) {
  const isFirst = activeIndex === 0;
  const isLast = activeIndex >= totalStages - 1;
  const stageColor = STAGE_COLORS[activeStageType];
  const animating = animationState === "running";
  const animPaused = animationState === "paused";
  const showPause = animating || (isPlaying && !animPaused);
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
        aria-hidden
      >
        {Array.from({ length: totalStages }).map((_, index) => {
          const segmentColor = STAGE_COLORS[stageTypes[index] ?? activeStageType].dot;
          return (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-colors",
                index <= activeIndex ? segmentColor : "bg-surface-muted/70",
                index === activeIndex && "opacity-80"
              )}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button aria-label="Previous stage" disabled={isFirst} onClick={() => navigate(activeIndex - 1)} className={iconBtn}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <button
          aria-label={showPause ? "Pause" : animPaused ? "Resume" : "Play"}
          onClick={togglePlay}
          className="flex size-9 items-center justify-center rounded-sm border border-accent bg-accent-muted text-accent-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        >
          {showPause ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </button>

        <button
          aria-label={stepMode ? "Switch to autoplay" : "Switch to step mode"}
          aria-pressed={!stepMode}
          title={stepMode ? "Step mode — Space advances one stage" : "Autoplay — stages advance after each animation"}
          onClick={toggleStepMode}
          className={iconBtn}
        >
          {stepMode ? <Play className="size-3.5" aria-hidden /> : <FastForward className="size-3.5" aria-hidden />}
        </button>

        <button aria-label="Next stage" disabled={isLast} onClick={() => navigate(activeIndex + 1)} className={iconBtn}>
          <ChevronRight className="size-4" aria-hidden />
        </button>

        <span className="mx-1 h-5 w-px bg-line" aria-hidden />

        <button
          aria-label="Skip animation"
          title="Skip to the result of this stage"
          disabled={!animating && !animPaused}
          onClick={skip}
          className={iconBtn}
        >
          <SkipForward className="size-3.5" aria-hidden />
        </button>
        <button aria-label="Replay stage" title="Replay this stage" onClick={replay} className={iconBtn}>
          <RotateCcw className="size-3.5" aria-hidden />
        </button>
        <button
          aria-label="Focus on changes"
          aria-pressed={focusOnChanges}
          title={focusOnChanges ? "Showing changed rows + summary" : "Showing all rows"}
          onClick={toggleFocusOnChanges}
          className={cn(iconBtn, focusOnChanges && "border-accent bg-accent-muted text-accent-ink")}
        >
          <Crosshair className="size-3.5" aria-hidden />
        </button>

        <span className="ml-1 inline-flex items-center gap-1 text-xs tabular-nums text-ink-muted" aria-live="polite">
          <span className={cn("inline-block size-2 rounded-full", stageColor.dot)} />
          Stage <span className="font-semibold text-ink-secondary">{activeIndex + 1}</span> of{" "}
          <span className="font-semibold text-ink-secondary">{totalStages}</span>:{" "}
          <span className="font-semibold text-ink-secondary">{activeStageType}</span>
          {animPaused && <span className="ml-1 rounded-sm border border-line px-1 text-[10px]">paused</span>}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 text-[10px] text-ink-muted">Speed</span>
          <div className="flex overflow-hidden rounded-sm border border-line">
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
                    : "bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink-secondary"
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
