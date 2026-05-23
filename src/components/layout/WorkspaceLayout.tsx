import type { ReactNode } from "react";

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
  return (
    <div
      className={cn(
        "flex flex-col gap-6 lg:flex-row lg:items-start",
        isResizing && "select-none"
      )}
    >
      <div className="lg:hidden">
        <aside className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30 backdrop-blur-sm">
          {sidebar}
        </aside>
      </div>

      <ResizableSidebar
        width={sidebarWidth}
        isResizing={isResizing}
        onResizeStart={onResizeStart}
      >
        {sidebar}
      </ResizableSidebar>

      <main className="min-w-0 flex-1 space-y-5">{children}</main>
    </div>
  );
}
