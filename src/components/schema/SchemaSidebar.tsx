import type { SchemaTable } from "../../lib/db/schema";

type Props = {
  tables: SchemaTable[];
  onRefresh: () => void;
};

export default function SchemaSidebar({ tables, onRefresh }: Props) {
  return (
    <aside className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
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
        <ul className="space-y-2">
          {tables.map((table) => (
            <li
              key={table.table_name}
              className="text-sm bg-slate-950 border border-slate-800 rounded p-2"
            >
              {table.table_name}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
