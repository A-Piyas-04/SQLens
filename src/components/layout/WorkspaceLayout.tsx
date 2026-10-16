import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { useCollapsibleSidebar } from "../../hooks/useCollapsibleSidebar";
import { cn } from "../../lib/utils/cn";
import MeetTheDevButton from "./MeetTheDevButton";
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
        "flex flex-col gap-6 lg:flex-row lg:items-stretch",
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
            className="flex w-full min-w-0 items-center justify-between gap-2 px-4 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted hover:text-ink sm:px-6"
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

      {/* Desktop left rail: sidebar and Meet the Dev are siblings; button pinned to bottom */}
      <div className="hidden shrink-0 flex-col items-start lg:flex">
        <ResizableSidebar
          width={sidebarWidth}
          isResizing={isResizing}
          onResizeStart={onResizeStart}
          collapsed={collapsed}
          onToggleCollapsed={toggle}
        >
          {sidebar}
        </ResizableSidebar>
        <div className="mt-auto">
          <MeetTheDevButton />
        </div>
      </div>

      <main className="min-w-0 flex-1 space-y-5">{children}</main>
    </div>
  );
}
