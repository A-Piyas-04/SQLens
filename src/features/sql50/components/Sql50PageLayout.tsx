import type { ReactNode } from "react";

import { cn } from "../../../lib/utils/cn";

const LEFT_WIDTH = 280;
const RIGHT_WIDTH = 300;

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

      <div className="flex min-h-0 flex-1">
        {/* Left sidebar — problems & schema */}
        <aside
          className="hidden shrink-0 flex-col border-r border-line bg-surface-raised lg:flex"
          style={{ width: LEFT_WIDTH }}
          aria-label="Problems and schema"
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden p-3">
            {left}
          </div>
        </aside>

        {/* Center — editor hero + results */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {center}
        </main>

        {/* Right sidebar — progress, statement, hints */}
        <aside
          className="hidden shrink-0 flex-col border-l border-line bg-surface-raised lg:flex"
          style={{ width: RIGHT_WIDTH }}
          aria-label="Problem details and progress"
        >
          <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3 scrollbar-thin">
            {right}
          </div>
        </aside>
      </div>

      {/* Mobile: panels below editor */}
      {mobilePanels ? (
        <div className="shrink-0 border-t border-line bg-surface-raised lg:hidden">
          {mobilePanels}
        </div>
      ) : null}
    </div>
  );
}

type EditorZoneProps = {
  children: ReactNode;
  className?: string;
};

export function Sql50EditorZone({ children, className }: EditorZoneProps) {
  return (
    <section
      className={cn(
        "shrink-0 border-b border-line bg-surface-inset px-3 py-4 sm:px-5 sm:py-5",
        className
      )}
    >
      <div className="mx-auto w-full max-w-3xl space-y-3">{children}</div>
    </section>
  );
}

type ResultsZoneProps = {
  children: ReactNode;
};

export function Sql50ResultsZone({ children }: ResultsZoneProps) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 scrollbar-thin">
      <div className="mx-auto w-full max-w-3xl space-y-4">{children}</div>
    </section>
  );
}
