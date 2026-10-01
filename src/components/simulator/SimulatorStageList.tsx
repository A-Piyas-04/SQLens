import {
  ArrowUpDown,
  ChartBarStacked,
  Filter,
  Funnel,
  GitMerge,
  Hash,
  Layers,
  Table2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../../lib/utils/cn";
import type { SimulatorStage, SimulatorStageType } from "../../lib/simulator/types/simulatorTypes";

const STAGE_ICONS: Record<SimulatorStageType, LucideIcon> = {
  FROM: Table2,
  JOIN: GitMerge,
  WHERE: Filter,
  GROUP_BY: ChartBarStacked,
  HAVING: Funnel,
  SELECT: Layers,
  ORDER_BY: ArrowUpDown,
  LIMIT: Hash,
};

const STAGE_COLORS: Record<SimulatorStageType, string> = {
  FROM: "text-stone-800 bg-stone-100 border-stone-300 hover:bg-stone-50",
  JOIN: "text-orange-900 bg-orange-100 border-orange-300 hover:bg-orange-50",
  WHERE: "text-amber-900 bg-amber-100 border-amber-300 hover:bg-amber-50",
  GROUP_BY: "text-rose-900 bg-rose-100 border-rose-300 hover:bg-rose-50",
  HAVING: "text-orange-950 bg-orange-50 border-orange-200 hover:bg-orange-50/80",
  SELECT: "text-emerald-900 bg-emerald-100 border-emerald-300 hover:bg-emerald-50",
  ORDER_BY: "text-teal-900 bg-teal-100 border-teal-300 hover:bg-teal-50",
  LIMIT: "text-red-900 bg-red-100 border-red-300 hover:bg-red-50",
};

const CONNECTOR_COLORS: Record<SimulatorStageType, string> = {
  FROM: "bg-stone-400",
  JOIN: "bg-orange-500",
  WHERE: "bg-amber-500",
  GROUP_BY: "bg-rose-500",
  HAVING: "bg-orange-600",
  SELECT: "bg-emerald-500",
  ORDER_BY: "bg-teal-500",
  LIMIT: "bg-red-500",
};

type Props = {
  stages: SimulatorStage[];
};

export default function SimulatorStageList({ stages }: Props) {
  return (
    <div className="flex flex-col items-stretch gap-0">
      {stages.map((stage, i) => {
        const Icon = STAGE_ICONS[stage.type];
        const colorClass = STAGE_COLORS[stage.type];
        const connectorColor = CONNECTOR_COLORS[stage.type];
        const isLast = i === stages.length - 1;

        return (
          <div key={stage.id} className="flex flex-col items-start">
            <div
              className={cn(
                "flex w-full items-start gap-3 rounded-sm border px-4 py-3",
                "transition-colors duration-200",
                colorClass
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">
                  {stage.label}
                </p>
                <p className="mt-0.5 text-xs opacity-70 leading-snug">
                  {stage.description}
                </p>
              </div>

              <span className="retro-stamp ml-auto shrink-0 bg-surface-inset px-2 py-1 opacity-70">
                {i + 1}
              </span>
            </div>

            {!isLast && (
              <div className="ml-6 flex flex-col items-center gap-0.5 py-1">
                <div className={cn("h-3 w-0.5", connectorColor)} />
                <div className="size-1 bg-line-strong" />
                <div className={cn("h-3 w-0.5", CONNECTOR_COLORS[stages[i + 1].type])} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
