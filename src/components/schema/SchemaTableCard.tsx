import { Link2 } from "lucide-react";

import type { SchemaTable } from "../../lib/db/schema";
import { getColumnUniqueConstraints } from "../../lib/db/schema";
import { cn } from "../../lib/utils/cn";

type Props = {
  table: SchemaTable;
};

export default function SchemaTableCard({ table }: Props) {
  const pkSet = new Set(table.primaryKeys);

  return (
    <article
      className={cn(
        "retro-inset bg-surface-raised p-3",
        "transition-[background-color,border-color] duration-100 ease-out",
        "hover:border-ink hover:bg-surface-elevated"
      )}
    >
      <h3 className="mb-2 font-medium text-accent-ink">{table.table_name}</h3>

      <div className="space-y-1">
        {table.columns.map((column) => {
          const fk = table.foreignKeys.find(
            (item) => item.column_name === column.column_name
          );
          const isPk = pkSet.has(column.column_name);
          const uniques = getColumnUniqueConstraints(table, column.column_name);

          return (
            <div
              key={column.column_name}
              className={cn(
                "border-t border-line px-1 pt-2 text-xs",
                "transition-colors duration-150 hover:bg-surface-raised"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  {isPk && (
                    <span
                      className="shrink-0 rounded-sm px-1 py-px font-mono text-[9px] font-bold text-white"
                      style={{ backgroundColor: "var(--color-erd-pk-badge)" }}
                    >
                      PK
                    </span>
                  )}
                  {uniques.map((unique) => (
                    <span
                      key={unique.constraint_name}
                      className="shrink-0 rounded bg-stone-700 px-1 py-px font-mono text-[9px] font-bold text-stone-100"
                      title={
                        unique.column_names.length > 1
                          ? `UNIQUE (${unique.column_names.join(", ")})`
                          : "UNIQUE"
                      }
                    >
                      UQ
                    </span>
                  ))}
                  <span className="font-mono text-ink">
                    {column.column_name}
                  </span>
                </div>
                <span className="text-ink-muted">{column.data_type}</span>
              </div>

              <div className="text-ink-muted">
                {column.is_nullable === "NO" ? "NOT NULL" : "NULL"}
                {column.column_default ? " · default" : ""}
              </div>

              {fk && (
                <div className="mt-1 flex items-center gap-1 text-accent-ink">
                  <Link2 className="size-3 shrink-0" aria-hidden />
                  <span className="font-mono">
                    FK → {fk.foreign_table_name}.{fk.foreign_column_name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {table.checkConstraints.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-line pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Check constraints
          </p>
          {table.checkConstraints.map((check) => (
            <div
              key={check.constraint_name}
              className="rounded-sm bg-surface-raised px-2 py-1.5 font-mono text-[10px] leading-snug text-ink-muted"
            >
              <span className="text-accent/90">{check.constraint_name}</span>
              <span className="text-ink-muted"> · </span>
              <span className="text-ink-secondary">{check.check_clause}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
