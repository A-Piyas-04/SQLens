import { Copy, Download } from "lucide-react";

import AnimatedReveal from "../common/AnimatedReveal";
import Button from "../common/Button";
import Panel from "../common/Panel";
import { cn } from "../../lib/utils/cn";

type Props = {
  rows: Record<string, unknown>[];
  /** Compact layout for SQL50 — no panel chrome or duplicate headings. */
  embedded?: boolean;
};

export default function ResultTable({ rows, embedded = false }: Props) {
  if (rows.length === 0) {
    if (embedded) {
      return (
        <p className="px-1 py-2 text-center text-[11px] text-ink-muted">
          No results yet. Run a query to see rows here.
        </p>
      );
    }

    return (
      <Panel title="Results" dataTour="results-panel">
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-accent/35 bg-surface-inset px-6 py-10 text-center">
          <p className="text-sm font-medium text-accent-ink">No results yet</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-muted">
            Run a query to see rows here. Use Ctrl+Enter or the Run button in the editor.
          </p>
        </div>
      </Panel>
    );
  }

  const columns = Object.keys(rows[0]);

  async function copyResults() {
    await navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "query-results.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  const table = (
    <div
      className={cn(
        "overflow-auto rounded-sm border border-line bg-surface-inset",
        embedded ? "max-h-full" : "max-h-[420px]"
      )}
    >
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-10 bg-surface-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className={cn(
                  "border-b border-line text-left font-semibold tracking-wide whitespace-nowrap text-ink-secondary uppercase",
                  embedded ? "px-2 py-1 text-[10px]" : "px-4 py-2.5 text-xs"
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={cn(
                "border-b border-line transition-colors duration-150",
                "hover:bg-surface-muted"
              )}
            >
              {columns.map((col) => {
                const value = row[col];

                return (
                  <td
                    key={col}
                    className={cn(
                      "font-mono whitespace-nowrap text-ink",
                      embedded ? "px-2 py-1 text-[11px]" : "px-4 py-2.5 text-xs"
                    )}
                  >
                    {value === null ? (
                      <span className="italic text-orange-300">NULL</span>
                    ) : (
                      String(value)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="flex shrink-0 justify-end gap-1">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={copyResults}>
            <Copy className="size-3" aria-hidden />
            Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={downloadJson}>
            <Download className="size-3" aria-hidden />
            Export
          </Button>
        </div>
        {table}
      </div>
    );
  }

  return (
    <AnimatedReveal>
      <Panel
        title="Results"
        dataTour="results-panel"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={copyResults}>
              <Copy className="size-3.5" aria-hidden />
              Copy JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadJson}>
              <Download className="size-3.5" aria-hidden />
              Export JSON
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-ink-muted">
          <span className="font-medium text-ink-secondary">{rows.length}</span> row
          {rows.length === 1 ? "" : "s"} returned
        </p>
        {table}
      </Panel>
    </AnimatedReveal>
  );
}
