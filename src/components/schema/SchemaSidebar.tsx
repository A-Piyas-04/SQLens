import type { SchemaTable } from "../../lib/db/schema";

type Props = {
  tables: SchemaTable[];
  onRefresh: () => void;
};

export default function SchemaSidebar({ tables, onRefresh }: Props) {
  return (
    <aside className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-fit lg:sticky lg:top-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Schema</h2>

        <button
          onClick={onRefresh}
          className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-slate-400">No tables yet</p>
      ) : (
        <div className="space-y-4">
          {tables.map((table) => (
            <div
              key={table.table_name}
              className="bg-slate-950 border border-slate-800 rounded-lg p-3"
            >
              <h3 className="font-medium text-blue-300 mb-2">
                {table.table_name}
              </h3>

              <div className="space-y-1">
                {table.columns.map((column) => {
                  const fk = table.foreignKeys.find(
                    (item) => item.column_name === column.column_name
                  );

                  return (
                    <div
                      key={column.column_name}
                      className="text-xs border-t border-slate-800 pt-2"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="text-white">{column.column_name}</span>
                        <span className="text-slate-400">{column.data_type}</span>
                      </div>

                      <div className="text-slate-500">
                        {column.is_nullable === "NO" ? "NOT NULL" : "NULL"}
                        {column.column_default ? " · default" : ""}
                      </div>

                      {fk && (
                        <div className="text-emerald-400 mt-1">
                          FK → {fk.foreign_table_name}.{fk.foreign_column_name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
