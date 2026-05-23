import { useState } from "react";

import SqlEditor from "./components/editor/SqlEditor";
import ResultTable from "./components/results/ResultTable";

import { runQuery } from "./lib/db/query";
import { resetDatabase } from "./lib/db/reset";

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

  async function handleRunQuery() {
    setError("");
    setMessage("");

    const result = await runQuery(query);

    if (result.success) {
      setRows(result.rows);
      setMessage(result.message || "Query executed successfully.");
    } else {
      setRows([]);
      setError(result.error || "Unknown error");
    }
  }

  async function handleResetDatabase() {
    setError("");
    setMessage("");

    try {
      await resetDatabase();
      setRows([]);
      setMessage("Database reset successfully.");
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to reset database");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">
          SQL Simulator
        </h1>

        <SqlEditor
          value={query}
          onChange={setQuery}
        />

        <div className="flex gap-3">
          <button
            onClick={handleRunQuery}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
          >
            Run Query
          </button>

          <button
            onClick={handleResetDatabase}
            className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-medium"
          >
            Reset Database
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

        <ResultTable rows={rows} />
      </div>
    </div>
  );
}
