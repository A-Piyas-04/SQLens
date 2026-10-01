import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import type { SimulatorStageType } from "../../../lib/simulator";
import { STAGE_COLORS, STAGE_ICONS, STAGE_SUBTITLES } from "../stageConstants";
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
  const Icon = STAGE_ICONS[stageType];
  const colors = STAGE_COLORS[stageType];
  return (
    <div
      data-operation-bar
      role="status"
      aria-live="polite"
      className={cn("pb-operation-bar", colors.header, colors.border)}
    >
      <Icon className={cn("size-4 shrink-0", colors.icon)} aria-hidden />
      <span className={cn("shrink-0 text-xs font-semibold tracking-wide", colors.icon)}>{STAGE_LABEL[stageType]}</span>
      {expression && (
        <code className="min-w-0 truncate font-mono text-xs text-ink" title={expression}>
          {expression}
        </code>
      )}
      <span className="hidden min-w-0 truncate text-[11px] text-ink-muted xl:inline">· {STAGE_SUBTITLES[stageType]}</span>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-ink-secondary">
        {showBefore && (
          <>
            <span data-count-before>{beforeLabel}</span>
            <ArrowRight className="size-3 text-ink-muted" aria-hidden />
          </>
        )}
        <span data-count-after className={cn("font-semibold", countPhase === "after" ? "text-ink" : "text-ink-muted")}>
          {countPhase === "after" || !showBefore ? afterLabel : "…"}
        </span>
      </span>
      <span data-phase-label className="shrink-0 rounded-sm border border-line bg-surface-raised px-1.5 py-0.5 text-[10px] text-ink-muted">
        {PHASE_LABEL[phase]}
      </span>
    </div>
  );
});

export default PlaybackOperationBar;
