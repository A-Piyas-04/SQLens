import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { PracticeHubIcon } from "../icons";
import {
  PRACTICE_CATEGORIES,
  getPracticeCategory,
  type PracticeCategoryId,
} from "../../constants/practiceCategories";
import {
  HEADER_ACTION_ICON_SIZE,
  headerActionButtonClass,
  headerActionButtonOpenClass,
  headerActionIconAccentClass,
} from "../layout/headerActionButton";
import { cn } from "../../lib/utils/cn";
import PracticeCategoryContent from "./PracticeCategoryContent";

const ORBIT_RADIUS = 128;
const ORBIT_BEARINGS = [200, 225, 250, 272];

function bearingToOffset(bearingDeg: number, radius: number) {
  const rad = (bearingDeg * Math.PI) / 180;
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
  const hubRef = useRef<HTMLButtonElement>(null);
  const [hubCenter, setHubCenter] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !hubRef.current) {
      setHubCenter(null);
      return;
    }

    function updateHubCenter() {
      const el = hubRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setHubCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    updateHubCenter();
    window.addEventListener("resize", updateHubCenter);
    window.addEventListener("scroll", updateHubCenter, true);
    return () => {
      window.removeEventListener("resize", updateHubCenter);
      window.removeEventListener("scroll", updateHubCenter, true);
    };
  }, [isOpen, activeCategory]);

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
    <div className="relative flex shrink-0 items-stretch">
      {isOpen ? (
        <button
          type="button"
          className="retro-scrim fixed inset-0 z-40"
          aria-label="Close practice menu"
          onClick={() => {
            onSelectCategory(null);
            onToggle();
          }}
        />
      ) : null}

      {isOpen && hubCenter ? (
        <div
          className="pointer-events-none fixed z-50 overflow-visible"
          style={{
            left: hubCenter.x,
            top: hubCenter.y,
            width: 0,
            height: 0,
          }}
        >
          {activeCategory && activeMeta ? (
            <div
              ref={panelRef}
              className={cn(
                "practice-radial-panel pointer-events-auto absolute z-50",
                "w-[min(calc(100vw-2rem),280px)]",
                "retro-panel p-5",
                "right-full top-0 mr-3 max-sm:fixed max-sm:right-4 max-sm:top-16 max-sm:mr-0"
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <activeMeta.icon size={22} className="shrink-0" />
                  <h2 className="truncate text-sm font-semibold text-ink">
                    {activeMeta.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCategory(null)}
                  className="shrink-0 rounded-sm border border-danger-ink bg-danger-ink p-1 text-white transition-colors hover:border-red-800 hover:bg-red-800"
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

          {PRACTICE_CATEGORIES.map((category, index) => {
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
                    "group pointer-events-auto absolute right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2.5",
                    isActive && "z-40"
                  )}
                >
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-sm border px-2 py-1 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.12em]",
                      "shadow-[2px_2px_0_0_var(--color-retro-edge)] transition-colors duration-100",
                      isActive
                        ? "border-retro-chrome-dark bg-retro-chrome text-white"
                        : "border-retro-edge bg-[#efe8da] text-ink group-hover:bg-surface-elevated"
                    )}
                  >
                    {category.title}
                  </span>
                  <span
                    className={cn(
                      "retro-button flex size-11 shrink-0 items-center justify-center border transition-colors duration-100",
                      isActive
                        ? "border-retro-edge bg-accent text-white"
                        : "border-retro-edge bg-surface-elevated text-accent group-hover:bg-surface-muted"
                    )}
                  >
                    <Icon size={22} />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      <button
        ref={hubRef}
        type="button"
        onClick={onToggle}
        data-tour="practice-menu"
        aria-label={isOpen ? "Close practice menu" : "Open practice menu"}
        aria-expanded={isOpen}
        title={isOpen ? "Close practice menu" : "Samples, templates, and SQL snippets"}
        className={cn(
          headerActionButtonClass,
          "practice-hub-toggle",
          isOpen && headerActionButtonOpenClass
        )}
      >
        {isOpen ? (
          <span className="inline-flex shrink-0 items-center justify-center rounded-sm border border-danger-ink bg-danger-ink p-0.5 text-white">
            <X className="size-4" aria-hidden />
          </span>
        ) : (
          <PracticeHubIcon size={HEADER_ACTION_ICON_SIZE} className={cn("shrink-0", headerActionIconAccentClass)} />
        )}
        <span>{isOpen ? "Close" : "Practice"}</span>
      </button>
    </div>
  );
}
