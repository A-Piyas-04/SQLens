import type { ReactNode } from "react";
import { ChevronLeft, GripVertical, PanelLeftOpen } from "lucide-react";

import { SIDEBAR_COLLAPSED_WIDTH } from "../../constants/layout";
import { cn } from "../../lib/utils/cn";

type Props = {
  width: number;
  isResizing: boolean;
  onResizeStart: (clientX: number) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  children: ReactNode;
};

export default function ResizableSidebar({
  width,
  isResizing,
  onResizeStart,
  collapsed,
  onToggleCollapsed,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "relative hidden shrink-0 lg:block",
        !isResizing && "transition-[width] duration-200 ease-out"
      )}
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : width }}
    >
      <aside
        data-tour="workspace-sidebar"
        className={cn(
          "surface-3d h-[calc(100vh-8rem)] overflow-hidden rounded-sm",
          "border border-line bg-surface-raised",
          isResizing && "ring-2 ring-accent"
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className={cn(
              "group flex h-full w-full flex-col items-center gap-4 py-4",
              "text-ink-muted transition-colors duration-150 hover:bg-surface-muted hover:text-ink"
            )}
          >
            <span className="flex size-8 items-center justify-center rounded-sm border border-line bg-surface-elevated group-hover:border-line-strong">
              <PanelLeftOpen className="size-4" aria-hidden />
            </span>
            <span className="pb-rail-label font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
              Projects · Schema
            </span>
          </button>
        ) : (
          <div className="h-full overflow-y-auto p-4 scrollbar-thin">
            {children}
          </div>
        )}
      </aside>

      {collapsed ? null : (
        <>
          <button
            type="button"
            aria-label="Resize sidebar"
            onMouseDown={(event) => onResizeStart(event.clientX)}
            className={cn(
              "group absolute -right-2 top-0 z-20 flex h-full w-4 cursor-col-resize items-center justify-center",
              "transition-colors duration-200"
            )}
          >
            <span
              className={cn(
                "flex h-16 w-1.5 items-center justify-center rounded-full",
                "bg-surface-muted transition-all duration-200",
                "group-hover:h-24 group-hover:bg-accent",
                isResizing && "h-24 bg-accent"
              )}
            >
              <GripVertical
                className="size-3 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className={cn(
              "absolute -right-3 top-5 z-30 flex size-6 items-center justify-center rounded-full",
              "border border-line-strong bg-surface-elevated text-ink-muted",
              "shadow-[0_2px_0_#b5aea0] transition-colors duration-150",
              "hover:bg-accent hover:text-white hover:border-accent"
            )}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}
