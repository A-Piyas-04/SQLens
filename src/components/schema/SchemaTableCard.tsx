import { Link2 } from "lucide-react";

import type { SchemaTable } from "../../lib/db/schema";
import { cn } from "../../lib/utils/cn";

type Props = {
  table: SchemaTable;
};

export default function SchemaTableCard({ table }: Props) {
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

          return (
            <div
              key={column.column_name}
              className={cn(
                "rounded-md border-t border-slate-800/80 px-1 pt-2 text-xs",
                "transition-colors duration-150 hover:bg-slate-900/60"
              )}
            >
              <div className="flex justify-between gap-2">
                <span className="font-mono text-slate-100">
                  {column.column_name}
                </span>
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
    </article>
  );
}
