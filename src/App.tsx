import { useState } from "react";

import SqlEditor from "./components/editor/SqlEditor";
import ResultTable from "./components/results/ResultTable";
import SchemaSidebar from "./components/schema/SchemaSidebar";

import { getQueryHistory, saveQueryToHistory } from "./hooks/useQueryHistory";
import { runQuery, resetDatabase } from "./lib/db/query";
import { getTables, type SchemaTable } from "./lib/db/schema";

export default function App() {
  const [query, setQuery] = useState(`CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  gpa NUMERIC(3,2)
);

INSERT INTO students (name, gpa)
VALUES ('Alice', 3.80);

SELECT * FROM students;`);

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>(getQueryHistory());
  const [tables, setTables] = useState<SchemaTable[]>([]);

  async function refreshSchema() {
    const currentTables = await getTables();
    setTables(currentTables);
  }

  async function handleRunQuery() {
    setError("");
    setMessage("");
    setIsRunning(true);

    const result = await runQuery(query);

    if (result.success) {
      setRows(result.rows);
      setMessage(result.message || "Query executed successfully.");
      saveQueryToHistory(query);
      setHistory(getQueryHistory());
      await refreshSchema();
    } else {
      setRows([]);
      setError(result.error || "Unknown error");
    }

    setIsRunning(false);
  }

  async function handleResetDatabase() {
    await resetDatabase();
    setRows([]);
    setError("");
    setMessage("Database reset successfully.");
    await refreshSchema();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">
          SQL Simulator
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <SchemaSidebar tables={tables} onRefresh={refreshSchema} />

          <main className="space-y-6">
            <SqlEditor
              value={query}
              onChange={setQuery}
            />

            <div className="flex gap-3">
              <button
                onClick={handleRunQuery}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium"
              >
                {isRunning ? "Running..." : "Run Query"}
              </button>

              <button
                onClick={handleResetDatabase}
                className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-lg font-medium"
              >
                Reset DB
              </button>
            </div>

            {error && (
              <div className="bg-red-950 border border-red-700 text-red-300 p-4 rounded-lg">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-950 border border-green-700 text-green-300 p-4 rounded-lg">
                {message}
              </div>
            )}

            {history.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <h2 className="font-semibold mb-3">Query History</h2>

                <div className="space-y-2">
                  {history.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(item)}
                      className="block w-full text-left text-sm bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded p-3 truncate"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ResultTable rows={rows} />
          </main>
        </div>
      </div>
    </div>
  );
}
