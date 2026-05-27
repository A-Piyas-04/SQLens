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
        "rounded-lg border border-slate-800/90 bg-slate-950/80 p-3",
        "transition-all duration-200 ease-out",
        "hover:border-slate-600/80 hover:bg-slate-900/90 hover:shadow-md hover:shadow-slate-950/50"
      )}
    >
      <h3 className="mb-2 font-medium text-blue-300">{table.table_name}</h3>

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
                "rounded-md border-t border-slate-800/80 px-1 pt-2 text-xs",
                "transition-colors duration-150 hover:bg-slate-900/60"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  {isPk && (
                    <span className="shrink-0 rounded bg-amber-600/80 px-1 py-px font-mono text-[9px] font-bold text-amber-200">
                      PK
                    </span>
                  )}
                  {uniques.map((unique) => (
                    <span
                      key={unique.constraint_name}
                      className="shrink-0 rounded bg-violet-700/80 px-1 py-px font-mono text-[9px] font-bold text-violet-200"
                      title={
                        unique.column_names.length > 1
                          ? `UNIQUE (${unique.column_names.join(", ")})`
                          : "UNIQUE"
                      }
                    >
                      UQ
                    </span>
                  ))}
                  <span className="font-mono text-slate-100">
                    {column.column_name}
                  </span>
                </div>
                <span className="text-slate-400">{column.data_type}</span>
              </div>

              <div className="text-slate-500">
                {column.is_nullable === "NO" ? "NOT NULL" : "NULL"}
                {column.column_default ? " · default" : ""}
              </div>

              {fk && (
                <div className="mt-1 flex items-center gap-1 text-emerald-400">
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
        <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Check constraints
          </p>
          {table.checkConstraints.map((check) => (
            <div
              key={check.constraint_name}
              className="rounded-md bg-slate-900/80 px-2 py-1.5 font-mono text-[10px] leading-snug text-slate-400"
            >
              <span className="text-sky-400/90">{check.constraint_name}</span>
              <span className="text-slate-600"> · </span>
              <span className="text-slate-300">{check.check_clause}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
