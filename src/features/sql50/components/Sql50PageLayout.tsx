import type { ReactNode } from "react";

import { cn } from "../../../lib/utils/cn";

export const SQL50_LEFT_WIDTH = 260;
export const SQL50_RIGHT_WIDTH = 280;

type Props = {
  header: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  mobilePanels?: ReactNode;
};

export default function Sql50PageLayout({
  header,
  left,
  center,
  right,
  mobilePanels,
}: Props) {
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-surface text-ink">
      {header}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className="hidden h-full min-h-0 shrink-0 flex-col border-r border-line bg-surface-raised lg:flex"
          style={{ width: SQL50_LEFT_WIDTH }}
          aria-label="Problems and schema"
        >
          {left}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {center}
        </main>

        <aside
          className="hidden h-full min-h-0 shrink-0 flex-col border-l border-line bg-surface-raised lg:flex"
          style={{ width: SQL50_RIGHT_WIDTH }}
          aria-label="Progress and hints"
        >
          <div className="h-full min-h-0 overflow-y-auto p-3 scrollbar-thin">
            {right}
          </div>
        </aside>
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

/** Center column: strip, statement, editor, actions, results */
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

type WorkbenchSectionProps = {
  children: ReactNode;
  className?: string;
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

export function Sql50WorkbenchEditor({ children, className }: WorkbenchSectionProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-line bg-surface-inset px-3 py-2 sm:px-5",
        className
      )}
    >
      <div className="mx-auto w-full max-w-3xl">{children}</div>
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
  return (
    <section
      className={cn(
        "flex min-h-[30vh] flex-1 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-4",
        className
      )}
      aria-label="Query results"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col overflow-hidden">
        {children}
      </div>
    </section>
  );
}
