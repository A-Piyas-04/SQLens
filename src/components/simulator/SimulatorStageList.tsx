import {
  ArrowUpDown,
  Filter,
  GitMerge,
  Hash,
  Layers,
  Table2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../../lib/utils/cn";
import type { SimulatorStage, SimulatorStageType } from "../../lib/simulator/simulatorTypes";

const STAGE_ICONS: Record<SimulatorStageType, LucideIcon> = {
  FROM: Table2,
  JOIN: GitMerge,
  WHERE: Filter,
  SELECT: Layers,
  ORDER_BY: ArrowUpDown,
  LIMIT: Hash,
};

const STAGE_COLORS: Record<SimulatorStageType, string> = {
  FROM: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15",
  JOIN: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15",
  WHERE: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15",
  SELECT: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15",
  ORDER_BY: "text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15",
  LIMIT: "text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15",
};

const CONNECTOR_COLORS: Record<SimulatorStageType, string> = {
  FROM: "bg-blue-500/30",
  JOIN: "bg-purple-500/30",
  WHERE: "bg-amber-500/30",
  SELECT: "bg-emerald-500/30",
  ORDER_BY: "bg-sky-500/30",
  LIMIT: "bg-rose-500/30",
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
                "flex w-full items-start gap-3 rounded-lg border px-4 py-3",
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

              <span className="ml-auto shrink-0 rounded-full bg-slate-950/40 px-2 py-0.5 text-[10px] font-mono font-medium opacity-60">
                {i + 1}
              </span>
            </div>

            {!isLast && (
              <div className="ml-6 flex flex-col items-center gap-0.5 py-1">
                <div className={cn("h-3 w-0.5 rounded-full", connectorColor)} />
                <div className="size-1 rounded-full bg-slate-600/60" />
                <div className={cn("h-3 w-0.5 rounded-full", CONNECTOR_COLORS[stages[i + 1].type])} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
