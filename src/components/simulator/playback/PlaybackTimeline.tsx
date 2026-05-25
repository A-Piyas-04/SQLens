import {
  ArrowUpDown,
  ChartBarStacked,
  Check,
  Filter,
  Funnel,
  GitMerge,
  Hash,
  Layers,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../../lib/utils/cn";
import type { SimulatorSnapshot } from "../../../lib/simulator";
import type { SimulatorStageType } from "../../../lib/simulator";

const STAGE_ICONS: Record<SimulatorStageType, LucideIcon> = {
  FROM:     Table2,
  JOIN:     GitMerge,
  WHERE:    Filter,
  GROUP_BY: ChartBarStacked,
  HAVING:   Funnel,
  SELECT:   Layers,
  ORDER_BY: ArrowUpDown,
  LIMIT:    Hash,
};

const STAGE_COLORS: Record<SimulatorStageType, {
  active:    string;
  completed: string;
  pending:   string;
  iconActive:string;
  dot:       string;
}> = {
  FROM:     { active: "bg-blue-500/15 border-l-2 border-l-blue-400 text-blue-200",    completed: "text-slate-400", pending: "text-slate-600", iconActive: "text-blue-400",    dot: "bg-blue-400" },
  JOIN:     { active: "bg-purple-500/15 border-l-2 border-l-purple-400 text-purple-200", completed: "text-slate-400", pending: "text-slate-600", iconActive: "text-purple-400",  dot: "bg-purple-400" },
  WHERE:    { active: "bg-amber-500/15 border-l-2 border-l-amber-400 text-amber-200",  completed: "text-slate-400", pending: "text-slate-600", iconActive: "text-amber-400",   dot: "bg-amber-400" },
  GROUP_BY: { active: "bg-violet-500/15 border-l-2 border-l-violet-400 text-violet-200", completed: "text-slate-400", pending: "text-slate-600", iconActive: "text-violet-400", dot: "bg-violet-400" },
  HAVING:   { active: "bg-orange-500/15 border-l-2 border-l-orange-400 text-orange-200", completed: "text-slate-400", pending: "text-slate-600", iconActive: "text-orange-400", dot: "bg-orange-400" },
  SELECT:   { active: "bg-emerald-500/15 border-l-2 border-l-emerald-400 text-emerald-200", completed: "text-slate-400", pending: "text-slate-600", iconActive: "text-emerald-400", dot: "bg-emerald-400" },
  ORDER_BY: { active: "bg-sky-500/15 border-l-2 border-l-sky-400 text-sky-200",        completed: "text-slate-400", pending: "text-slate-600", iconActive: "text-sky-400",     dot: "bg-sky-400" },
  LIMIT:    { active: "bg-rose-500/15 border-l-2 border-l-rose-400 text-rose-200",     completed: "text-slate-400", pending: "text-slate-600", iconActive: "text-rose-400",    dot: "bg-rose-400" },
};

type Props = {
  snapshots:   SimulatorSnapshot[];
  activeIndex: number;
  navigate:    (i: number) => void;
  /** If true, clicking a stage also pauses autoplay */
  onNavigate?: () => void;
};

export default function PlaybackTimeline({ snapshots, activeIndex, navigate, onNavigate }: Props) {
  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-slate-700/50 bg-slate-900/50 overflow-y-auto">
      <div className="px-3 py-3 border-b border-slate-700/40">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Execution Plan
        </p>
      </div>

      <nav className="flex flex-col py-2 gap-0.5">
        {snapshots.map((snap, i) => {
          const colors  = STAGE_COLORS[snap.stageType];
          const Icon    = STAGE_ICONS[snap.stageType];
          const isActive    = i === activeIndex;
          const isCompleted = i < activeIndex;
          const isPending   = i > activeIndex;

          return (
            <button
              key={snap.stageId}
              onClick={() => { navigate(i); onNavigate?.(); }}
              className={cn(
                "group relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-150",
                isActive    && colors.active,
                isCompleted && cn("hover:bg-slate-800/60", colors.completed),
                isPending   && cn("hover:bg-slate-800/40", colors.pending)
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {/* Icon slot */}
              <span className={cn(
                "flex size-5 shrink-0 items-center justify-center",
                isActive    ? colors.iconActive : isCompleted ? "text-slate-500" : "text-slate-700"
              )}>
                {isCompleted ? (
                  <Check className="size-3.5 text-slate-500" aria-hidden />
                ) : (
                  <Icon className="size-3.5" aria-hidden />
                )}
              </span>

              {/* Label + row count */}
              <span className="flex flex-1 flex-col min-w-0">
                <span className={cn(
                  "text-xs font-medium leading-tight truncate",
                  isActive ? "" : isCompleted ? "text-slate-500" : "text-slate-600"
                )}>
                  {snap.label}
                </span>
                <span className="text-[10px] leading-tight text-slate-600">
                  {snap.rowCount} row{snap.rowCount !== 1 ? "s" : ""}
                </span>
              </span>

              {/* Active dot */}
              {isActive && (
                <span
                  className={cn("ml-auto size-1.5 rounded-full shrink-0", colors.dot)}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
