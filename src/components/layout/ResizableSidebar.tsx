import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";

import { cn } from "../../lib/utils/cn";

type Props = {
  width: number;
  isResizing: boolean;
  onResizeStart: (clientX: number) => void;
  children: ReactNode;
};

export default function ResizableSidebar({
  width,
  isResizing,
  onResizeStart,
  children,
}: Props) {
  return (
  <div
      className="relative hidden shrink-0 lg:block"
      style={{ width }}
    >
      <aside
        className={cn(
          "h-[calc(100vh-8rem)] overflow-hidden rounded-xl",
          "border border-slate-800/70 bg-slate-900/55 backdrop-blur-md",
          "shadow-xl shadow-slate-950/40 ring-1 ring-white/[0.03]",
          "transition-shadow duration-200",
          isResizing && "shadow-2xl shadow-blue-950/30 ring-1 ring-blue-500/25"
        )}
      >
        <div className="h-full overflow-y-auto p-4 scrollbar-thin">
          {children}
        </div>
      </aside>

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
            "bg-slate-700/50 transition-all duration-200",
            "group-hover:h-24 group-hover:bg-blue-500/70",
            isResizing && "h-24 bg-blue-400"
          )}
        >
          <GripVertical
            className="size-3 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </span>
      </button>
    </div>
  );
}
