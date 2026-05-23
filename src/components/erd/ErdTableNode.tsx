import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import type { ErdTableNodeData } from "../../lib/erd/buildErdGraph";
import { cn } from "../../lib/utils/cn";

type ErdTableNodeType = Node<ErdTableNodeData, "erdTable">;

export default function ErdTableNode({ data }: NodeProps<ErdTableNodeType>) {
  const { table } = data;
  const pkSet = new Set(table.primaryKeys);
  const fkSet = new Set(table.foreignKeys.map((fk) => fk.column_name));

  return (
    <div className="min-w-[248px] overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900 shadow-xl shadow-slate-950/60">
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#60a5fa", border: "none", width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#60a5fa", border: "none", width: 8, height: 8 }}
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        style={{ background: "#60a5fa", border: "none", width: 8, height: 8 }}
      />
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        style={{ background: "#60a5fa", border: "none", width: 8, height: 8 }}
      />

      {/* Table header */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 bg-blue-950/50 px-3 py-2.5">
        <div className="size-2 shrink-0 rounded-full bg-blue-400/70" aria-hidden />
        <span className="truncate text-sm font-semibold text-blue-300">
          {table.table_name}
        </span>
      </div>

      {/* Column rows */}
      <div className="divide-y divide-slate-800/60">
        {table.columns.map((col) => {
          const isPk = pkSet.has(col.column_name);
          const isFk = fkSet.has(col.column_name);

          return (
            <div
              key={col.column_name}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-1.5 text-xs",
                isPk && "bg-amber-950/20",
                isFk && !isPk && "bg-emerald-950/20"
              )}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                {isPk && (
                  <span className="shrink-0 rounded bg-amber-600/80 px-1 py-px font-mono text-[9px] font-bold leading-tight text-amber-200">
                    PK
                  </span>
                )}
                {isFk && (
                  <span className="shrink-0 rounded bg-emerald-700/80 px-1 py-px font-mono text-[9px] font-bold leading-tight text-emerald-200">
                    FK
                  </span>
                )}
                <span
                  className={cn(
                    "truncate font-mono",
                    isPk
                      ? "text-amber-100"
                      : isFk
                        ? "text-emerald-100"
                        : "text-slate-200"
                  )}
                >
                  {col.column_name}
                </span>
              </div>
              <span className="shrink-0 text-slate-500">{col.data_type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
