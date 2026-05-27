import { useEffect, useState } from "react";
import { cn } from "../../../lib/utils/cn";
import type { SimulatorStageType } from "../../../lib/simulator";
import { STAGE_COLORS, STAGE_ICONS, STAGE_SUBTITLES } from "../stageConstants";

type Props = {
  stageType: SimulatorStageType;
  animationKey: number;
};

export default function StageEntryBanner({ stageType, animationKey }: Props) {
  const Icon = STAGE_ICONS[stageType];
  const colors = STAGE_COLORS[stageType];
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [animationKey, stageType]);

  if (!visible) return null;

  return (
    <div
      key={animationKey}
      className={cn(
        "pb-stage-entry-banner absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border bg-slate-800/95 px-3 py-1.5 shadow-lg",
        colors.border
      )}
      style={{ animationDuration: "200ms" }}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", colors.icon)} aria-hidden />
        <span className="text-xs font-semibold text-white">{stageType}</span>
        <span className="text-xs text-slate-400">· {STAGE_SUBTITLES[stageType]}</span>
      </div>
    </div>
  );
}
