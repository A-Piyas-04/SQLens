import { GripHorizontal, GripVertical } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  SQL50_LEFT_SIDEBAR_DEFAULT_WIDTH,
  SQL50_LEFT_SIDEBAR_STORAGE_KEY,
  SQL50_RESULTS_DEFAULT_HEIGHT,
  SQL50_RESULTS_HEIGHT_STORAGE_KEY,
  SQL50_RESULTS_MIN_HEIGHT,
  SQL50_RIGHT_SIDEBAR_DEFAULT_WIDTH,
  SQL50_RIGHT_SIDEBAR_STORAGE_KEY,
  SQL50_SIDEBAR_MAX_WIDTH,
  SQL50_SIDEBAR_MIN_WIDTH,
} from "../../../constants/layout";
import { useResizablePanel } from "../../../hooks/useResizablePanel";
import { useVerticalResizablePanel } from "../../../hooks/useVerticalResizablePanel";
import { cn } from "../../../lib/utils/cn";

const SQL50_EDITOR_RESERVED_HEIGHT = 200;

const Sql50WorkbenchMainContext = createContext(0);

function useSql50WorkbenchMainHeight() {
  return useContext(Sql50WorkbenchMainContext);
}

export const SQL50_LEFT_WIDTH = SQL50_LEFT_SIDEBAR_DEFAULT_WIDTH;
export const SQL50_RIGHT_WIDTH = SQL50_RIGHT_SIDEBAR_DEFAULT_WIDTH;

type Props = {
  header: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  mobilePanels?: ReactNode;
};

type ResizableAsideProps = {
  width: number;
  isResizing: boolean;
  onResizeStart: (clientX: number) => void;
  edge: "left" | "right";
  ariaLabel: string;
  children: ReactNode;
  scrollable?: boolean;
};

function Sql50ResizableAside({
  width,
  isResizing,
  onResizeStart,
  edge,
  ariaLabel,
  children,
  scrollable = false,
}: ResizableAsideProps) {
  const handlePosition = edge === "right" ? "-right-2" : "-left-2";
  const borderClass = edge === "right" ? "border-r" : "border-l";

  return (
    <div
      className="relative hidden h-full min-h-0 shrink-0 lg:block"
      style={{ width }}
    >
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col bg-surface-raised",
          borderClass,
          "border-line",
          isResizing && "ring-2 ring-accent"
        )}
        aria-label={ariaLabel}
      >
        {scrollable ? (
          <div className="h-full min-h-0 overflow-y-auto p-3 scrollbar-thin">
            {children}
          </div>
        ) : (
          children
        )}
      </aside>

      <button
        type="button"
        aria-label={`Resize ${ariaLabel.toLowerCase()}`}
        onMouseDown={(event) => onResizeStart(event.clientX)}
        className={cn(
          "group absolute top-0 z-20 flex h-full w-4 cursor-col-resize items-center justify-center",
          handlePosition
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
    </div>
  );
}

export default function Sql50PageLayout({
  header,
  left,
  center,
  right,
  mobilePanels,
}: Props) {
  const leftPanel = useResizablePanel({
    minWidth: SQL50_SIDEBAR_MIN_WIDTH,
    maxWidth: SQL50_SIDEBAR_MAX_WIDTH,
    defaultWidth: SQL50_LEFT_SIDEBAR_DEFAULT_WIDTH,
    storageKey: SQL50_LEFT_SIDEBAR_STORAGE_KEY,
    edge: "right",
  });

  const rightPanel = useResizablePanel({
    minWidth: SQL50_SIDEBAR_MIN_WIDTH,
    maxWidth: SQL50_SIDEBAR_MAX_WIDTH,
    defaultWidth: SQL50_RIGHT_SIDEBAR_DEFAULT_WIDTH,
    storageKey: SQL50_RIGHT_SIDEBAR_STORAGE_KEY,
    edge: "left",
  });

  const isResizing = leftPanel.isResizing || rightPanel.isResizing;

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-surface text-ink">
      {header}

      <div
        className={cn(
          "flex min-h-0 flex-1 overflow-hidden",
          isResizing && "select-none"
        )}
      >
        <Sql50ResizableAside
          width={leftPanel.width}
          isResizing={leftPanel.isResizing}
          onResizeStart={leftPanel.onResizeStart}
          edge="right"
          ariaLabel="Problems and schema"
        >
          {left}
        </Sql50ResizableAside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-x-3 border-black">
          {center}
        </main>

        <Sql50ResizableAside
          width={rightPanel.width}
          isResizing={rightPanel.isResizing}
          onResizeStart={rightPanel.onResizeStart}
          edge="left"
          ariaLabel="Progress and hints"
          scrollable
        >
          {right}
        </Sql50ResizableAside>
      </div>

      {mobilePanels ? (
        <div className="shrink-0 border-t border-line bg-surface-raised lg:hidden">
          {mobilePanels}
        </div>
      ) : null}
    </div>
  );
}

type WorkbenchProps = {
  children: ReactNode;
  className?: string;
};

/** Center column: strip, actions, editor, results */
export function Sql50Workbench({ children, className }: WorkbenchProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-surface",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Editor + results share remaining vertical space below the problem strip. */
export function Sql50WorkbenchMain({ children, className }: WorkbenchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mainHeight, setMainHeight] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setMainHeight(Math.floor(entry.contentRect.height));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Sql50WorkbenchMainContext.Provider value={mainHeight}>
      <div
        ref={containerRef}
        className={cn(
          "grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden",
          className
        )}
      >
        {children}
      </div>
    </Sql50WorkbenchMainContext.Provider>
  );
}

type WorkbenchSectionProps = {
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  mobileActions?: ReactNode;
};

export function Sql50WorkbenchTop({ children, className }: WorkbenchSectionProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-line bg-surface-inset px-3 py-3 sm:px-5",
        className
      )}
    >
      <div className="mx-auto w-full max-w-3xl space-y-2">{children}</div>
    </div>
  );
}

export function Sql50WorkbenchEditor({
  children,
  actions,
  mobileActions,
  className,
}: WorkbenchSectionProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden border-b border-line bg-surface-inset",
        className
      )}
    >
      {mobileActions ? (
        <div className="shrink-0 border-b border-line bg-surface px-3 py-2 xl:hidden sm:px-5">
          <div className="mx-auto w-full max-w-3xl">{mobileActions}</div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 px-3 py-2 sm:px-5">
        <div className="flex min-h-0 w-full flex-1 gap-4">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col xl:max-w-3xl">
            {children}
          </div>
          {actions ? (
            <aside
              className="hidden min-h-0 w-40 shrink-0 flex-col border-l border-line pl-4 xl:flex"
              aria-label="Query actions"
            >
              <div className="flex min-h-0 flex-1 flex-col rounded-sm border border-line bg-accent-muted/25 p-2.5">
                {actions}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Sql50WorkbenchActions({ children, className }: WorkbenchSectionProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-line bg-surface px-3 py-2 sm:px-5",
        className
      )}
    >
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  );
}

export function Sql50WorkbenchResults({ children, className }: WorkbenchSectionProps) {
  const mainHeight = useSql50WorkbenchMainHeight();
  const resultsPanel = useVerticalResizablePanel({
    minHeight: SQL50_RESULTS_MIN_HEIGHT,
    defaultHeight: SQL50_RESULTS_DEFAULT_HEIGHT,
    storageKey: SQL50_RESULTS_HEIGHT_STORAGE_KEY,
  });

  const maxResultsHeight =
    mainHeight > 0
      ? Math.max(
          SQL50_RESULTS_MIN_HEIGHT,
          mainHeight - SQL50_EDITOR_RESERVED_HEIGHT
        )
      : resultsPanel.height;

  const effectiveHeight = Math.min(resultsPanel.height, maxResultsHeight);

  return (
    <div
      className={cn(
        "relative min-h-0 overflow-hidden",
        resultsPanel.isResizing && "select-none"
      )}
      style={{ height: effectiveHeight }}
    >
      <button
        type="button"
        aria-label="Resize results panel"
        onMouseDown={(event) => resultsPanel.onResizeStart(event.clientY)}
        className="group absolute -top-2 left-0 z-20 flex h-4 w-full cursor-row-resize items-center justify-center"
      >
        <span
          className={cn(
            "flex h-1.5 w-16 items-center justify-center rounded-full",
            "bg-surface-muted transition-all duration-200",
            "group-hover:w-24 group-hover:bg-accent",
            resultsPanel.isResizing && "w-24 bg-accent"
          )}
        >
          <GripHorizontal
            className="size-3 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </span>
      </button>

      <section
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-4",
          resultsPanel.isResizing && "ring-2 ring-accent",
          className
        )}
        aria-label="Query results"
      >
        <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col overflow-hidden">
          {children}
        </div>
      </section>
    </div>
  );
}
