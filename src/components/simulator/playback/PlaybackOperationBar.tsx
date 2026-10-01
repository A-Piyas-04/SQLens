import { memo } from "react";
import { cn } from "../../../lib/utils/cn";
import type { SimulatorStageType } from "../../../lib/simulator";
import { STAGE_COLORS, STAGE_SUBTITLES } from "../stageConstants";
import StageGlyph from "../StageGlyph";
import { STAGE_LABEL } from "./animation/stageSqlParts";
import type { PlaybackPhase } from "./animation/stageAnimationTypes";

type Props = {
  stageType: SimulatorStageType;
  expression: string;
  beforeLabel: string;
  afterLabel: string;
  /** "after" once the result phase has revealed the new count. */
  countPhase: "before" | "after";
  phase: PlaybackPhase;
  showBefore: boolean;
};

const PHASE_LABEL: Record<PlaybackPhase, string> = {
  focus: "Focus",
  action: "Applying",
  result: "Result",
  settled: "Done",
};

/**
 * Permanent operation bar above the visualisation (replaces the floating
 * banner). It sits in normal flow, so it can never cover table headers.
 */
const PlaybackOperationBar = memo(function PlaybackOperationBar({
  stageType,
  expression,
  beforeLabel,
  afterLabel,
  countPhase,
  phase,
  showBefore,
}: Props) {
  const colors = STAGE_COLORS[stageType];
  const done = phase === "settled";
  return (
    <div data-operation-bar role="status" aria-live="polite" className="pb-operation-bar">
      <StageGlyph stageType={stageType} />
      <span className={cn("shrink-0 font-display text-sm font-bold tracking-tight", colors.icon)}>
        {STAGE_LABEL[stageType]}
      </span>
      {expression && (
        <code className="min-w-0 truncate font-mono text-xs text-ink" title={expression}>
          {expression}
        </code>
      )}
      <span className="hidden min-w-0 truncate text-[11px] italic text-ink-muted xl:inline">{STAGE_SUBTITLES[stageType]}</span>
      <span className="ml-auto flex shrink-0 items-baseline gap-1.5 font-mono text-xs tabular-nums text-ink-muted">
        {showBefore && (
          <>
            <span data-count-before>{beforeLabel}</span>
            <span aria-hidden>→</span>
          </>
        )}
        <span data-count-after className={cn("font-semibold", countPhase === "after" ? "text-ink" : "text-ink-muted")}>
          {countPhase === "after" || !showBefore ? afterLabel : "…"}
        </span>
      </span>
      <span
        data-phase-label
        className={cn(
          "shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
          done ? "border-ink bg-ink text-surface" : "border-line-strong text-ink-secondary"
        )}
      >
        {PHASE_LABEL[phase]}
      </span>
    </div>
  );
});

export default PlaybackOperationBar;
