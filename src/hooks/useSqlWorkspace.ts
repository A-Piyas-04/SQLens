import type { PGlite } from "@electric-sql/pglite";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { DEFAULT_QUERY } from "../constants/queries";
import { runQuery, resetDatabase } from "../lib/db/query";
import { getSchema, type SchemaTable } from "../lib/db/schema";
import {
  getProjectDraft,
  setProjectDraft,
} from "../lib/projects/projectStore";
import { withViewTransition } from "../lib/utils/viewTransition";
import { getQueryHistory, saveQueryToHistory } from "./useQueryHistory";

export function useSqlWorkspace(db: PGlite, projectId: string) {
  const [query, setQuery] = useState(
    () => getProjectDraft(projectId) || DEFAULT_QUERY
  );
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>(() =>
    getQueryHistory(projectId)
  );
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [, startUiTransition] = useTransition();

  // Keep a ref so async callbacks always read the latest projectId/db
  const projectIdRef = useRef(projectId);
  const dbRef = useRef(db);
  useEffect(() => {
    projectIdRef.current = projectId;
    dbRef.current = db;
  });

  const refreshSchema = useCallback(async () => {
    const currentSchema = await getSchema(dbRef.current);
    withViewTransition(() => {
      startUiTransition(() => {
        setTables(currentSchema);
      });
    });
  }, [startUiTransition]);

  // Reset workspace state when the active project changes
  useEffect(() => {
    const draft = getProjectDraft(projectId);
    withViewTransition(() => {
      startUiTransition(() => {
        setQuery(draft || DEFAULT_QUERY);
        setRows([]);
        setError("");
        setMessage("");
        setHistory(getQueryHistory(projectId));
        setTables([]);
      });
    });
    void refreshSchema();
  }, [projectId, refreshSchema, startUiTransition]);

  // Persist editor draft whenever the query changes
  useEffect(() => {
    setProjectDraft(projectId, query);
  }, [projectId, query]);

  async function handleRunQuery() {
    setError("");
    setMessage("");
    setIsRunning(true);

    const result = await runQuery(dbRef.current, query);

    if (result.success) {
      withViewTransition(() => {
        startUiTransition(() => {
          setRows(result.rows);
          setMessage(result.message ?? "Query executed successfully.");
        });
      });
      saveQueryToHistory(projectIdRef.current, query);
      setHistory(getQueryHistory(projectIdRef.current));
      await refreshSchema();
    } else {
      withViewTransition(() => {
        startUiTransition(() => {
          setRows([]);
          setError(result.error ?? "Unknown error");
        });
      });
    }

    setIsRunning(false);
  }

  async function handleResetDatabase() {
    await resetDatabase(dbRef.current);
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
