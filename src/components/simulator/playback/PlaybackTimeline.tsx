// @deprecated — merged into SqlContextPanel via StageStepList
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
  FROM:     { active: "border-retro-edge bg-surface-elevated text-ink shadow-[inset_2px_2px_0_rgb(28_25_22/0.12)]", completed: "text-ink-muted", pending: "text-ink-muted", iconActive: "text-stone-700", dot: "bg-stone-600" },
  JOIN:     { active: "border-retro-edge bg-surface-elevated text-ink shadow-[inset_2px_2px_0_rgb(28_25_22/0.12)]", completed: "text-ink-muted", pending: "text-ink-muted", iconActive: "text-orange-800", dot: "bg-orange-700" },
  WHERE:    { active: "border-retro-edge bg-surface-elevated text-ink shadow-[inset_2px_2px_0_rgb(28_25_22/0.12)]", completed: "text-ink-muted", pending: "text-ink-muted", iconActive: "text-amber-800", dot: "bg-amber-700" },
  GROUP_BY: { active: "border-retro-edge bg-surface-elevated text-ink shadow-[inset_2px_2px_0_rgb(28_25_22/0.12)]", completed: "text-ink-muted", pending: "text-ink-muted", iconActive: "text-rose-800", dot: "bg-rose-700" },
  HAVING:   { active: "border-retro-edge bg-surface-elevated text-ink shadow-[inset_2px_2px_0_rgb(28_25_22/0.12)]", completed: "text-ink-muted", pending: "text-ink-muted", iconActive: "text-orange-900", dot: "bg-orange-800" },
  SELECT:   { active: "border-retro-edge bg-surface-elevated text-ink shadow-[inset_2px_2px_0_rgb(28_25_22/0.12)]", completed: "text-ink-muted", pending: "text-ink-muted", iconActive: "text-emerald-800", dot: "bg-emerald-700" },
  ORDER_BY: { active: "border-retro-edge bg-surface-elevated text-ink shadow-[inset_2px_2px_0_rgb(28_25_22/0.12)]", completed: "text-ink-muted", pending: "text-ink-muted", iconActive: "text-teal-800", dot: "bg-teal-700" },
  LIMIT:    { active: "border-retro-edge bg-surface-elevated text-ink shadow-[inset_2px_2px_0_rgb(28_25_22/0.12)]", completed: "text-ink-muted", pending: "text-ink-muted", iconActive: "text-red-800", dot: "bg-red-700" },
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
    <aside className="flex w-48 shrink-0 flex-col border-r border-line bg-surface-raised overflow-y-auto">
      <div className="px-3 py-3 border-b border-line">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
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
                "group relative flex w-full items-center gap-2.5 border border-transparent px-3 py-2.5 text-left transition-colors duration-150",
                isActive    && colors.active,
                isCompleted && cn("hover:bg-surface-muted", colors.completed),
                isPending   && cn("hover:bg-surface-muted", colors.pending)
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {/* Icon slot */}
              <span className={cn(
                "flex size-5 shrink-0 items-center justify-center",
                isActive    ? colors.iconActive : isCompleted ? "text-ink-muted" : "text-ink-muted"
              )}>
                {isCompleted ? (
                  <Check className="size-3.5 text-ink-muted" aria-hidden />
                ) : (
                  <Icon className="size-3.5" aria-hidden />
                )}
              </span>

              {/* Label + row count */}
              <span className="flex flex-1 flex-col min-w-0">
                <span className={cn(
                  "text-xs font-medium leading-tight truncate",
                  isActive ? "" : isCompleted ? "text-ink-muted" : "text-ink-muted"
                )}>
                  {snap.label}
                </span>
                <span className="text-[10px] leading-tight text-ink-muted">
                  {snap.rowCount} row{snap.rowCount !== 1 ? "s" : ""}
                </span>
              </span>

              {/* Active dot */}
              {isActive && (
                <span
                  className={cn("ml-auto size-2 shrink-0 border border-retro-edge", colors.dot)}
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
