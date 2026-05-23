type Props = {
  rows: Record<string, unknown>[];
};

export default function ResultTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="text-slate-400 bg-slate-900 border border-slate-800 rounded-lg p-4">
        No results
      </div>
    );
  }

  const columns = Object.keys(rows[0]);

  async function copyResults() {
    await navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "query-results.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <p className="text-sm text-slate-400">
          {rows.length} row(s) returned
        </p>

        <div className="flex gap-2">
          <button
            onClick={copyResults}
            className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded"
          >
            Copy JSON
          </button>

          <button
            onClick={downloadJson}
            className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto border border-slate-700 rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-2 border-b border-slate-700 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-800">
                {columns.map((col) => {
                  const value = row[col];

                  return (
                    <td key={col} className="px-4 py-2 whitespace-nowrap">
                      {value === null ? (
                        <span className="text-orange-300 italic">NULL</span>
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
    </div>
  );
}
