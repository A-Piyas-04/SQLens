import { LayoutGrid, X } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";

import {
  PRACTICE_CATEGORIES,
  getPracticeCategory,
  type PracticeCategoryId,
} from "../../constants/practiceCategories";
import { cn } from "../../lib/utils/cn";
import PracticeCategoryContent from "./PracticeCategoryContent";

/**
 * Arc at fixed compass bearings 180°, 200°, 230°, 270° (down → down-left → left).
 * Screen offsets: +x = left, +y = down.
 * Order: samples (180°) → templates (200°) → snippets (230°) → presets (270°).
 */
const ORBIT_RADIUS = 148;
/** Fixed bearings per category: samples → templates → snippets → presets */
const ORBIT_BEARINGS = [180, 221, 245, 270];

function bearingToOffset(bearingDeg: number, radius: number) {
  const rad = (bearingDeg * Math.PI) / 180;
  // Compass ° clockwise from north → screen (+x left, +y down)
  return {
    x: Math.sin(rad) * radius,
    y: -Math.cos(rad) * radius,
  };
}

function getOrbitSlot(index: number) {
  const bearing = ORBIT_BEARINGS[index] ?? ORBIT_BEARINGS[0];
  return bearingToOffset(bearing, ORBIT_RADIUS);
}
type Props = {
  isOpen: boolean;
  activeCategory: PracticeCategoryId | null;
  isLoading: boolean;
  onToggle: () => void;
  onSelectCategory: (id: PracticeCategoryId | null) => void;
  onLoadSampleDatabase: (databaseId: string) => void;
  onLoadQuery: (sql: string) => void;
  onInsertSnippet: (sql: string) => void;
  onApplyVisualizationPreset: (presetId: string) => void;
};

export default function PracticeRadialMenu({
  isOpen,
  activeCategory,
  isLoading,
  onToggle,
  onSelectCategory,
  onLoadSampleDatabase,
  onLoadQuery,
  onInsertSnippet,
  onApplyVisualizationPreset,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (activeCategory) onSelectCategory(null);
        else onToggle();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeCategory, onSelectCategory, onToggle]);

  function handleCategoryClick(id: PracticeCategoryId) {
    onSelectCategory(activeCategory === id ? null : id);
  }

  const activeMeta = activeCategory ? getPracticeCategory(activeCategory) : null;

  return (
    <div className="fixed top-4 right-4 z-50 overflow-visible sm:top-5 sm:right-5">
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
          aria-label="Close practice menu"
          onClick={() => {
            onSelectCategory(null);
            onToggle();
          }}
        />
      ) : null}

      {/* Anchor box: hub top-right; arc expands left/down with room for labels */}
      <div className="relative z-50 h-[210px] w-[min(100vw-2rem,300px)] overflow-visible sm:w-[300px]">
        {isOpen && activeCategory && activeMeta ? (
          <div
            ref={panelRef}
            className={cn(
              "practice-radial-panel absolute z-50",
              "w-[min(calc(100vw-5.5rem),280px)]",
              "rounded-xl border border-slate-700/80 bg-slate-900/95 p-4",
              "shadow-2xl shadow-slate-950/60 backdrop-blur-md",
              "right-0 top-[4.75rem] sm:right-[calc(100%+0.75rem)] sm:top-0"
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex min-w-0 items-center gap-2">
                <activeMeta.icon className="size-4 shrink-0 text-blue-400" aria-hidden />
                <h2 className="truncate text-sm font-semibold text-slate-100">
                  {activeMeta.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Back to categories"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <PracticeCategoryContent
              categoryId={activeCategory}
              isLoading={isLoading}
              onLoadSampleDatabase={onLoadSampleDatabase}
              onLoadQuery={onLoadQuery}
              onInsertSnippet={onInsertSnippet}
              onApplyVisualizationPreset={onApplyVisualizationPreset}
              compact
            />
          </div>
        ) : null}

        {/* Orbit anchor = hub center */}
        <div className="pointer-events-none absolute right-7 top-7 size-0">
          {isOpen
            ? PRACTICE_CATEGORIES.map((category, index) => {
                const isActive = activeCategory === category.id;
                const Icon = category.icon;
                const { x, y } = getOrbitSlot(index);

                return (
                  <div
                    key={category.id}
                    className="practice-orbit-item pointer-events-none absolute left-0 top-0"
                    style={
                      {
                        "--orbit-x": `${x}px`,
                        "--orbit-y": `${y}px`,
                        "--orbit-delay": `${index * 60}ms`,
                      } as CSSProperties
                    }
                  >
                    <button
                      type="button"
                      title={category.title}
                      onClick={() => handleCategoryClick(category.id)}
                      className={cn(
                        "group pointer-events-auto absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2.5",
                        isActive && "z-10"
                      )}
                    >
                      <span
                        className={cn(
                          "max-w-[9.5rem] truncate text-right text-xs font-medium leading-tight",
                          "drop-shadow-[0_1px_2px_rgba(2,6,23,0.9)]",
                          isActive ? "text-blue-200" : "text-slate-200"
                        )}
                      >
                        {category.title}
                      </span>
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-full border shadow-lg transition-colors duration-200",
                          isActive
                            ? "border-blue-400/70 bg-blue-600/90 text-white shadow-blue-950/50"
                            : "border-slate-600/80 bg-slate-800/95 text-blue-300 shadow-slate-950/50 group-hover:border-blue-500/50 group-hover:bg-slate-700"
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                    </button>
                  </div>
                );
              })
            : null}
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? "Close practice menu" : "Open practice menu"}
          aria-expanded={isOpen}
          className={cn(
            "practice-hub-toggle absolute right-0 top-0 z-20 flex size-14 items-center justify-center rounded-full",
            "border border-slate-600/80 bg-slate-800/95 text-blue-300",
            "shadow-xl shadow-slate-950/60 backdrop-blur-sm",
            "hover:border-blue-500/50 hover:bg-slate-700 hover:text-blue-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
            isOpen && "border-blue-500/50 bg-blue-950/90 text-blue-200 practice-hub-open"
          )}
        >
          {isOpen ? (
            <X className="size-5" aria-hidden />
          ) : (
            <LayoutGrid className="size-5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
