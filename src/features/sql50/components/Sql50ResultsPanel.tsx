import { useEffect, useRef, type ReactNode } from "react";

import ResultTable from "../../../components/results/ResultTable";

type Props = {
  rows: Record<string, unknown>[];
  children?: ReactNode;
};

export default function Sql50ResultsPanel({ rows, children }: Props) {
  const prevRowCountRef = useRef(0);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prevCount = prevRowCountRef.current;
    if (prevCount === 0 && rows.length > 0 && headerRef.current) {
      headerRef.current.classList.remove("results-header-flash");
      void headerRef.current.offsetWidth;
      headerRef.current.classList.add("results-header-flash");
    }
    prevRowCountRef.current = rows.length;
  }, [rows.length]);

  const rowLabel =
    rows.length === 0
      ? null
      : `${rows.length} row${rows.length === 1 ? "" : "s"}`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-line bg-surface-inset">
      <header
        ref={headerRef}
        className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-accent-muted/30 px-3 py-1.5"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3.5 w-0.5 shrink-0 rounded-sm bg-accent" aria-hidden />
          <h2 className="font-display text-xs font-semibold tracking-wide text-ink">
            Results
          </h2>
        </div>
        {rowLabel ? (
          <span className="shrink-0 text-[11px] text-ink-muted">{rowLabel}</span>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2 scrollbar-thin">
        {children}
        <ResultTable rows={rows} embedded />
      </div>
    </div>
  );
}
