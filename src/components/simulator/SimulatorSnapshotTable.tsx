import { cn } from "../../lib/utils/cn";

type Props = {
  rows: Record<string, unknown>[];
};

export default function SimulatorSnapshotTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-slate-500">
        No rows at this stage.
      </p>
    );
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="max-h-[280px] overflow-auto rounded-lg border border-slate-700/60">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="border-b border-slate-700/80 px-3 py-2 text-left font-semibold whitespace-nowrap text-slate-300"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={cn(
                "border-b border-slate-800/60 transition-colors duration-100",
                "hover:bg-slate-800/30",
                rowIdx % 2 === 0 ? "bg-transparent" : "bg-slate-900/30"
              )}
            >
              {columns.map((col) => {
                const value = row[col];
                return (
                  <td
                    key={col}
                    className="px-3 py-2 font-mono whitespace-nowrap text-slate-300"
                  >
                    {value === null || value === undefined ? (
                      <span className="italic text-orange-400/80">NULL</span>
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
  );
}
