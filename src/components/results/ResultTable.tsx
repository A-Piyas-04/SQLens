type Props = {
  rows: Record<string, unknown>[];
};

export default function ResultTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="text-slate-400">
        No results
      </div>
    );
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-auto border border-slate-700 rounded-lg">
      <table className="w-full border-collapse">
        <thead className="bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="text-left px-4 py-2 border-b border-slate-700"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className="border-b border-slate-800"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-4 py-2"
                >
                  {String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
