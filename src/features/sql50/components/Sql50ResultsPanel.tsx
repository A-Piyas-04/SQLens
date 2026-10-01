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
    <div className="retro-inset flex h-full min-h-0 flex-col overflow-hidden">
      <header
        ref={headerRef}
        className="flex shrink-0 items-center gap-3 border-b border-retro-chrome-dark bg-retro-chrome px-3 py-1.5 text-white"
      >
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">Results</h2>
        <span className="flex-1 border-t border-dashed border-white/40" aria-hidden />
        {rowLabel ? (
          <span className="shrink-0 font-mono text-[10px] text-white/70">{rowLabel}</span>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2 scrollbar-thin">
        {children}
        <ResultTable rows={rows} embedded />
      </div>
    </div>
  );
}
