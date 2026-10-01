import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import {
  columnRowCenter,
  type ErdTableNodeData,
} from "../../lib/erd/buildErdGraph";
import { getColumnUniqueConstraints } from "../../lib/db/schema";
import { cn } from "../../lib/utils/cn";

type ErdTableNodeType = Node<ErdTableNodeData, "erdTable">;

export default function ErdTableNode({ data }: NodeProps<ErdTableNodeType>) {
  const { table } = data;
  const pkSet = new Set(table.primaryKeys);
  const fkSet = new Set(table.foreignKeys.map((fk) => fk.column_name));

  const columnHandles = table.columns.flatMap((col, index) => {
    const rowTop = columnRowCenter(index);
    const sides = [
      ["source", "top", Position.Top],
      ["source", "right", Position.Right],
      ["source", "bottom", Position.Bottom],
      ["source", "left", Position.Left],
      ["target", "top", Position.Top],
      ["target", "right", Position.Right],
      ["target", "bottom", Position.Bottom],
      ["target", "left", Position.Left],
    ] as const;

    return sides.map(([role, side, position]) => {
      const id = `${role}-${side}-col-${col.column_name}`;
      const isVerticalSide = side === "left" || side === "right";
      return (
        <Handle
          key={id}
          type={role}
          id={id}
          position={position}
          className="!border-none !bg-transparent !opacity-0"
          style={{
            width: 1,
            height: 1,
            minWidth: 0,
            minHeight: 0,
            pointerEvents: "none",
            ...(isVerticalSide ? { top: rowTop } : { left: "50%" }),
          }}
        />
      );
    });
  });

  return (
    <div className="min-w-[248px] overflow-hidden border-2 border-retro-edge bg-surface-elevated shadow-[4px_4px_0_var(--color-retro-edge)]">
      {columnHandles}

      <div className="flex items-center gap-2 border-b border-line bg-accent-soft px-3 py-2.5">
        <div className="size-2 shrink-0 border border-ink bg-accent" aria-hidden />
        <span className="truncate text-sm font-semibold text-accent-ink">
          {table.table_name}
        </span>
      </div>

      <div className="divide-y divide-line bg-surface-raised">
        {table.columns.map((col) => {
          const isPk = pkSet.has(col.column_name);
          const isFk = fkSet.has(col.column_name);
          const uniques = getColumnUniqueConstraints(table, col.column_name);
          const hasUq = uniques.length > 0;

          return (
            <div
              key={col.column_name}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-1.5 text-xs",
                isPk && "bg-erd-pk-bg",
                isFk && !isPk && "bg-erd-fk-bg",
                !isPk && !isFk && hasUq && "bg-surface-muted",
                !isPk && !isFk && !hasUq && "bg-surface-raised"
              )}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                {isPk && (
                  <span
                    className="shrink-0 rounded-sm px-1 py-px font-mono text-[9px] font-bold leading-tight text-white"
                    style={{ backgroundColor: "var(--color-erd-pk-badge)" }}
                  >
                    PK
                  </span>
                )}
                {isFk && (
                  <span
                    className="shrink-0 rounded-sm px-1 py-px font-mono text-[9px] font-bold leading-tight text-white"
                    style={{ backgroundColor: "var(--color-erd-fk-badge)" }}
                  >
                    FK
                  </span>
                )}
                {hasUq && (
                  <span
                    className="shrink-0 rounded-sm bg-line-strong px-1 py-px font-mono text-[9px] font-bold leading-tight text-white"
                    title={
                      uniques[0].column_names.length > 1
                        ? `UNIQUE (${uniques[0].column_names.join(", ")})`
                        : "UNIQUE"
                    }
                  >
                    UQ
                  </span>
                )}
                <span
                  className={cn(
                    "truncate font-mono",
                    isPk && "text-erd-pk-ink",
                    isFk && !isPk && "text-erd-fk-ink",
                    !isPk && !isFk && "text-ink"
                  )}
                >
                  {col.column_name}
                </span>
              </div>
              <span className="shrink-0 text-ink-muted">{col.data_type}</span>
            </div>
          );
        })}
      </div>

      {table.checkConstraints.length > 0 ? (
        <div className="border-t border-line bg-surface-muted px-3 py-2">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
            CHECK
          </p>
          {table.checkConstraints.map((check) => (
            <p
              key={check.constraint_name}
              className="truncate font-mono text-[9px] leading-tight text-ink-muted"
              title={`${check.constraint_name}: ${check.check_clause}`}
            >
              {check.check_clause}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
