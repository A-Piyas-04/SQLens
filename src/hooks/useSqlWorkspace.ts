import { useCallback, useEffect, useState, useTransition } from "react";

import { DEFAULT_QUERY } from "../constants/queries";
import { getQueryHistory, saveQueryToHistory } from "./useQueryHistory";
import { runQuery, resetDatabase } from "../lib/db/query";
import { getSchema, type SchemaTable } from "../lib/db/schema";
import { withViewTransition } from "../lib/utils/viewTransition";

export function useSqlWorkspace() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getQueryHistory());
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [, startUiTransition] = useTransition();

  const refreshSchema = useCallback(async () => {
    const currentSchema = await getSchema();
    withViewTransition(() => {
      startUiTransition(() => {
        setTables(currentSchema);
      });
    });
  }, [startUiTransition]);

  useEffect(() => {
    void refreshSchema();
  }, [refreshSchema]);

  async function handleRunQuery() {
    setError("");
    setMessage("");
    setIsRunning(true);

    const result = await runQuery(query);

    if (result.success) {
      withViewTransition(() => {
        startUiTransition(() => {
          setRows(result.rows);
          setMessage(result.message || "Query executed successfully.");
        });
      });
      saveQueryToHistory(query);
      setHistory(getQueryHistory());
      await refreshSchema();
    } else {
      withViewTransition(() => {
        startUiTransition(() => {
          setRows([]);
          setError(result.error || "Unknown error");
        });
      });
    }

    setIsRunning(false);
  }

  async function handleResetDatabase() {
    await resetDatabase();
    withViewTransition(() => {
      startUiTransition(() => {
        setRows([]);
        setError("");
        setMessage("Database reset successfully.");
      });
    });
    await refreshSchema();
  }

  function loadHistoryItem(item: string) {
    withViewTransition(() => {
      startUiTransition(() => {
        setQuery(item);
      });
    });
  }

  return {
    query,
    setQuery,
    rows,
    error,
    message,
    isRunning,
    history,
    tables,
    refreshSchema,
    handleRunQuery,
    handleResetDatabase,
    loadHistoryItem,
  };
}
