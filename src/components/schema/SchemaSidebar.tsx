import { RefreshCw, Table2 } from "lucide-react";

import type { SchemaTable } from "../../lib/db/schema";
import AnimatedReveal from "../common/AnimatedReveal";
import Button from "../common/Button";
import SchemaTableCard from "./SchemaTableCard";

type Props = {
  tables: SchemaTable[];
  onRefresh: () => void;
};

export default function SchemaSidebar({ tables, onRefresh }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Table2 className="size-4 text-blue-400" aria-hidden />
          <h2 className="font-semibold text-slate-100">Schema</h2>
        </div>

        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw className="size-3.5" aria-hidden />
          Refresh
        </Button>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-slate-400">No tables yet</p>
      ) : (
        <div className="space-y-3">
          {tables.map((table) => (
            <AnimatedReveal key={table.table_name}>
              <SchemaTableCard table={table} />
            </AnimatedReveal>
          ))}
        </div>
      )}
    </div>
  );
}
