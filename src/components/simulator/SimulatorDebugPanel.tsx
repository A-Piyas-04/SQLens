import { useState } from "react";
import { Bug, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils/cn";
import type { SimulatorSnapshot, StageDiff } from "../../lib/simulator/types/snapshotTypes";

type Props = {
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
};

type Tab = "sql" | "rowids" | "diff";

/**
 * Collapsible debug panel shown below the snapshot viewer.
 * Activated by clicking the bug icon — intended for developer inspection of
 * generated SQL, row IDs, and diff metadata without opening DevTools.
 */
export default function SimulatorDebugPanel({ snapshots, diffs }: Props) {
  const [open, setOpen] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [tab, setTab] = useState<Tab>("sql");

  const snapshot = snapshots[activeStage];
  const diff = activeStage > 0 ? diffs[activeStage - 1] : null;

  if (!snapshot) return null;

  return (
    <div className="rounded-lg border border-slate-700/40">
      {/* Toggle row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-800/30"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="size-3.5 text-slate-600" aria-hidden />
        ) : (
          <ChevronRight className="size-3.5 text-slate-600" aria-hidden />
        )}
        <Bug className="size-3.5 text-slate-600" aria-hidden />
        <span className="text-[11px] font-medium text-slate-500">
          Debug inspector
        </span>
        <span className="ml-auto text-[10px] text-slate-700">
          {snapshots.length} stage{snapshots.length !== 1 ? "s" : ""}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-700/40">
          {/* Stage selector */}
          <div className="flex gap-1 border-b border-slate-700/40 px-3 py-2">
            {snapshots.map((s, i) => (
              <button
                key={s.stageId}
                onClick={() => setActiveStage(i)}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-mono transition-colors",
                  activeStage === i
                    ? "bg-slate-700 text-slate-200"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-slate-700/40 px-3 py-2">
            {(["sql", "rowids", "diff"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
                  tab === t
                    ? "bg-slate-700/60 text-slate-200"
                    : "text-slate-600 hover:text-slate-400"
                )}
              >
                {t === "rowids" ? "Row IDs" : t === "diff" ? "Diff" : "SQL"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[240px] overflow-auto p-3">
            {tab === "sql" && (
              <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-emerald-400">
                {snapshot.sql}
              </pre>
            )}

            {tab === "rowids" && (
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="border-b border-slate-700/40 pb-1 text-left font-mono text-slate-500">
                      _rowId
                    </th>
                    <th className="border-b border-slate-700/40 pb-1 text-left font-mono text-slate-500 pl-4">
                      values (preview)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.rows.map((row) => {
                    const preview = Object.entries(row)
                      .filter(([k]) => k !== "_rowId")
                      .slice(0, 3)
                      .map(([k, v]) => `${k}=${v === null ? "NULL" : String(v)}`)
                      .join(", ");
                    return (
                      <tr key={row._rowId} className="border-b border-slate-800/40">
                        <td className="py-1 font-mono text-sky-400">{row._rowId}</td>
                        <td className="py-1 pl-4 font-mono text-slate-400 truncate max-w-[200px]">
                          {preview}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {tab === "diff" && (
              diff ? (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-slate-500 uppercase">
                      Row diffs ({diff.rowDiffs.length})
                    </p>
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr>
                          <th className="border-b border-slate-700/40 pb-1 text-left font-mono text-slate-500">rowId</th>
                          <th className="border-b border-slate-700/40 pb-1 text-left font-mono text-slate-500 pl-3">status</th>
                          <th className="border-b border-slate-700/40 pb-1 text-left font-mono text-slate-500 pl-3">reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diff.rowDiffs.map((d) => (
                          <tr key={d.rowId} className="border-b border-slate-800/40">
                            <td className="py-1 font-mono text-sky-400">{d.rowId}</td>
                            <td className="py-1 pl-3 font-mono text-slate-300">{d.status}</td>
                            <td className="py-1 pl-3 text-slate-500 max-w-[200px] truncate">{d.reason ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-slate-500 uppercase">
                      Column diffs ({diff.columnDiffs.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {diff.columnDiffs.map((c) => (
                        <span
                          key={c.column}
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[10px] font-mono",
                            c.status === "hidden"
                              ? "border-red-500/30 text-red-400"
                              : "border-slate-700/40 text-slate-400"
                          )}
                        >
                          {c.column}
                          {c.status === "hidden" && " ✕"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] italic text-slate-600">
                  No diff — this is the first stage.
                </p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
