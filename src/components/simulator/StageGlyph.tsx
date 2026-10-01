import type { SimulatorStageType } from "../../lib/simulator";
import { cn } from "../../lib/utils/cn";
import { STAGE_COLORS, STAGE_ICONS } from "./stageConstants";

type Props = {
  stageType: SimulatorStageType;
  size?: "sm" | "md";
  className?: string;
};

/** Solid square stage marker — the single place a stage's colour is shown as a fill. */
export default function StageGlyph({ stageType, size = "md", className }: Props) {
  const Icon = STAGE_ICONS[stageType];
  return (
    <span
      className={cn("stage-glyph", size === "sm" ? "size-5" : "size-6", STAGE_COLORS[stageType].dot, className)}
      aria-hidden
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
    </span>
  );
}
