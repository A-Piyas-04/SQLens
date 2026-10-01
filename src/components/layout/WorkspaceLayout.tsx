import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { useCollapsibleSidebar } from "../../hooks/useCollapsibleSidebar";
import { cn } from "../../lib/utils/cn";
import ResizableSidebar from "./ResizableSidebar";

type Props = {
  sidebar: ReactNode;
  sidebarWidth: number;
  isResizing: boolean;
  onResizeStart: (clientX: number) => void;
  children: ReactNode;
};

export default function WorkspaceLayout({
  sidebar,
  sidebarWidth,
  isResizing,
  onResizeStart,
  children,
}: Props) {
  const { collapsed, toggle } = useCollapsibleSidebar();

  return (
    <div
      className={cn(
        "flex flex-col gap-6 lg:flex-row lg:items-start",
        isResizing && "select-none"
      )}
    >
      <div className="lg:hidden">
        <aside
          data-tour="workspace-sidebar"
          className="surface-3d rounded-sm border border-line bg-surface-raised"
        >
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            className="flex w-full items-center justify-between px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted hover:text-ink"
          >
            Projects · Schema
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                collapsed && "-rotate-90"
              )}
              aria-hidden
            />
          </button>
          {collapsed ? null : <div className="px-5 pb-6">{sidebar}</div>}
        </aside>
      </div>

      <ResizableSidebar
        width={sidebarWidth}
        isResizing={isResizing}
        onResizeStart={onResizeStart}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
      >
        {sidebar}
      </ResizableSidebar>

      <main className="min-w-0 flex-1 space-y-5">{children}</main>
    </div>
  );
}
