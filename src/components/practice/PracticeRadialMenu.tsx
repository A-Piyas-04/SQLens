import { ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import {
  PRACTICE_CATEGORIES,
  getPracticeCategory,
  type PracticeCategoryId,
} from "../../constants/practiceCategories";
import {
  headerActionButtonClass,
  headerActionButtonOpenClass,
} from "../layout/headerActionButton";
import { cn } from "../../lib/utils/cn";
import PracticeCategoryContent from "./PracticeCategoryContent";

const VIEWPORT_MARGIN = 8;
const STACK_OFFSET_Y = 10;
const STACK_WIDTH = 272;
const PANEL_WIDTH = 280;
const PANEL_GAP = 12;

const CATEGORY_STYLE: Record<PracticeCategoryId, { ring: string; glow: string; hint: string }> = {
  samples: { ring: "#22d3ee", glow: "rgba(34, 211, 238, 0.35)", hint: "Load ready-made datasets" },
  templates: { ring: "#60a5fa", glow: "rgba(96, 165, 250, 0.35)", hint: "Start from common queries" },
  snippets: { ring: "#f59e0b", glow: "rgba(245, 158, 11, 0.35)", hint: "Insert reusable SQL" },
  presets: { ring: "#a78bfa", glow: "rgba(167, 139, 250, 0.35)", hint: "Apply chart & view styles" },
};

type HubRect = { right: number; bottom: number };

type Layout = {
  stack: { left: number; top: number; width: number; maxHeight: number };
  panel: { left: number; top: number; width: number; maxHeight: number };
  sideBySide: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function computeLayout(hub: HubRect): Layout {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = hub.bottom + STACK_OFFSET_Y;
  const maxHeight = Math.max(120, vh - top - VIEWPORT_MARGIN);

  const stackWidth = Math.min(STACK_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const stackLeft = clamp(hub.right - stackWidth, VIEWPORT_MARGIN, vw - VIEWPORT_MARGIN - stackWidth);

  const panelWidth = Math.min(PANEL_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const besideLeft = stackLeft - PANEL_GAP - panelWidth;
  const sideBySide = besideLeft >= VIEWPORT_MARGIN;
  const panelLeft = sideBySide
    ? besideLeft
    : clamp(hub.right - panelWidth, VIEWPORT_MARGIN, vw - VIEWPORT_MARGIN - panelWidth);

  return {
    stack: { left: stackLeft, top, width: stackWidth, maxHeight },
    panel: { left: panelLeft, top, width: panelWidth, maxHeight },
    sideBySide,
  };
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
  const [layout, setLayout] = useState<Layout | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !hubRef.current) {
      setLayout(null);
      return;
    }

    function updateLayout() {
      const el = hubRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setLayout(computeLayout({ right: rect.right, bottom: rect.bottom }));
    }

    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);
    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
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
  const showStack = layout !== null && (!activeCategory || layout.sideBySide);

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

      {isOpen && layout && activeCategory && activeMeta ? (
        <div
          ref={panelRef}
          className="practice-radial-panel retro-panel fixed z-50 overflow-y-auto p-5"
          style={{
            left: layout.panel.left,
            top: layout.panel.top,
            width: layout.panel.width,
            maxHeight: layout.panel.maxHeight,
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <activeMeta.icon size={22} className="shrink-0" />
              <h2 className="truncate text-sm font-semibold text-ink">{activeMeta.title}</h2>
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

      {isOpen && layout && showStack ? (
        <div
          className="fixed z-50 flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden p-1"
          style={{
            left: layout.stack.left,
            top: layout.stack.top,
            width: layout.stack.width,
            maxHeight: layout.stack.maxHeight,
          }}
        >
          {PRACTICE_CATEGORIES.map((category, index) => {
            const isActive = activeCategory === category.id;
            const Icon = category.icon;
            const style = CATEGORY_STYLE[category.id];

            return (
              <button
                key={category.id}
                type="button"
                title={category.title}
                onClick={() => handleCategoryClick(category.id)}
                aria-pressed={isActive}
                className={cn(
                  "practice-orbit-item group flex w-full shrink-0 items-center gap-3 rounded-md border-2 py-2 pl-2 pr-3 text-left",
                  "shadow-[3px_3px_0_0_var(--color-retro-edge)] transition-[transform,background-color,box-shadow] duration-150",
                  "hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-retro-edge)]",
                  isActive
                    ? "border-retro-chrome-dark bg-retro-chrome text-white"
                    : "border-retro-edge bg-[#f6f0e3] text-ink hover:bg-surface-elevated"
                )}
                style={{ "--orbit-delay": `${index * 50}ms` } as CSSProperties}
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1c1a24] transition-transform duration-150 group-hover:scale-105"
                  style={{
                    border: `2px solid ${style.ring}`,
                    boxShadow: `0 0 0 3px ${style.glow}, inset 0 0 10px ${style.glow}`,
                  }}
                >
                  <Icon size={26} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-mono text-[11px] font-bold uppercase leading-none tracking-[0.1em]">
                    {category.title}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[11px] leading-tight",
                      isActive ? "text-white/80" : "text-ink-muted"
                    )}
                  >
                    {style.hint}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5",
                    isActive ? "text-white" : "text-ink-muted"
                  )}
                  aria-hidden
                />
              </button>
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
        <span>{isOpen ? "Close" : "Practice"}</span>
      </button>
    </div>
  );
}
