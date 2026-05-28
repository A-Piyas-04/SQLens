import { Copy, Download } from "lucide-react";

import AnimatedReveal from "../common/AnimatedReveal";
import Button from "../common/Button";
import Panel from "../common/Panel";
import { cn } from "../../lib/utils/cn";

type Props = {
  rows: Record<string, unknown>[];
};

export default function ResultTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <Panel title="Results" dataTour="results-panel">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700/70 bg-slate-950/40 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-300">No results yet</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
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
        <p className="mb-3 text-sm text-slate-400">
          <span className="font-medium text-slate-300">{rows.length}</span> row
          {rows.length === 1 ? "" : "s"} returned
        </p>

        <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-700/70 bg-slate-950/30">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border-b border-slate-700/70 px-4 py-2.5 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-slate-300 uppercase"
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
                    "border-b border-slate-800/80 transition-colors duration-150",
                    "hover:bg-slate-800/40"
                  )}
                >
                  {columns.map((col) => {
                    const value = row[col];

                    return (
                      <td
                        key={col}
                        className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-slate-200"
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
      </Panel>
    </AnimatedReveal>
  );
}
