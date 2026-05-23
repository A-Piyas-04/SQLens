import type { PGlite } from "@electric-sql/pglite";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { DEFAULT_QUERY } from "../constants/queries";
import { getSampleDatabaseById } from "../data/sampleDatabases";
import { VISUALIZATION_PRESETS } from "../data/visualizationPresets";
import {
  execSqlScript,
  resetDatabase,
  runQuery,
} from "../lib/db/query";
import { getSchema, type SchemaTable } from "../lib/db/schema";
import {
  getProjectDraft,
  setProjectDraft,
} from "../lib/projects/projectStore";
import { simplifySqlError } from "../lib/sql/simplifyError";
import { withViewTransition } from "../lib/utils/viewTransition";
import {
  clearQueryHistory,
  getQueryHistory,
  saveQueryToHistory,
} from "./useQueryHistory";

export function useSqlWorkspace(db: PGlite, projectId: string) {
  const [query, setQuery] = useState(
    () => getProjectDraft(projectId) || DEFAULT_QUERY
  );
  const [selectedText, setSelectedText] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>(() =>
    getQueryHistory(projectId)
  );
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [, startUiTransition] = useTransition();

  const projectIdRef = useRef(projectId);
  const dbRef = useRef(db);
  const queryRef = useRef(query);
  const selectedTextRef = useRef(selectedText);

  useEffect(() => {
    projectIdRef.current = projectId;
    dbRef.current = db;
  });

  useEffect(() => {
    queryRef.current = query;
    selectedTextRef.current = selectedText;
  }, [query, selectedText]);

  const refreshSchema = useCallback(async () => {
    const currentSchema = await getSchema(dbRef.current);
    withViewTransition(() => {
      startUiTransition(() => {
        setTables(currentSchema);
      });
    });
  }, [startUiTransition]);

  useEffect(() => {
    const draft = getProjectDraft(projectId);
    withViewTransition(() => {
      startUiTransition(() => {
        setQuery(draft || DEFAULT_QUERY);
        setSelectedText("");
        setRows([]);
        setError("");
        setMessage("");
        setHistory(getQueryHistory(projectId));
        setTables([]);
      });
    });
    void refreshSchema();
  }, [projectId, refreshSchema, startUiTransition]);

  useEffect(() => {
    setProjectDraft(projectId, query);
  }, [projectId, query]);

  const applyQueryResult = useCallback(
    async (
      sql: string,
      result: Awaited<ReturnType<typeof runQuery>>,
      options: { isPartial?: boolean; saveHistory?: boolean } = {}
    ) => {
      const { isPartial = false, saveHistory = true } = options;

      if (result.success) {
        withViewTransition(() => {
          startUiTransition(() => {
            setRows(result.rows);
            const baseMessage =
              result.message ?? "Query executed successfully.";
            setMessage(isPartial ? `${baseMessage} (selection)` : baseMessage);
          });
        });
        if (saveHistory) {
          saveQueryToHistory(projectIdRef.current, sql);
          setHistory(getQueryHistory(projectIdRef.current));
        }
        await refreshSchema();
      } else {
        withViewTransition(() => {
          startUiTransition(() => {
            setRows([]);
            setError(simplifySqlError(result.error ?? "Unknown error"));
          });
        });
      }
    },
    [refreshSchema, startUiTransition]
  );

  async function handleRunQuery() {
    const sqlToRun = selectedTextRef.current.trim() || queryRef.current;
    const isPartial = !!selectedTextRef.current.trim();

    setError("");
    setMessage("");
    setIsRunning(true);

    const result = await runQuery(dbRef.current, sqlToRun);
    await applyQueryResult(sqlToRun, result, { isPartial, saveHistory: true });
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

  function loadQuery(sql: string) {
    withViewTransition(() => {
      startUiTransition(() => {
        setQuery(sql);
        setSelectedText("");
        setError("");
      });
    });
  }

  async function loadSampleDatabase(databaseId: string) {
    const sample = getSampleDatabaseById(databaseId);
    if (!sample) return;

    setIsRunning(true);
    setError("");
    setMessage("");

    await resetDatabase(dbRef.current);
    const result = await execSqlScript(dbRef.current, sample.sql);

    if (!result.success) {
      withViewTransition(() => {
        startUiTransition(() => {
          setRows([]);
          setError(simplifySqlError(result.error ?? "Failed to load sample."));
        });
      });
      setIsRunning(false);
      return;
    }

    clearQueryHistory(projectIdRef.current);

    withViewTransition(() => {
      startUiTransition(() => {
        setHistory([]);
        setRows([]);
        setSelectedText("");
        setQuery(
          sample.starterQuery ?? `-- ${sample.name} loaded\nSELECT 1;`
        );
        setMessage(`${sample.name} loaded.`);
      });
    });

    await refreshSchema();
    setIsRunning(false);
  }

  async function applyVisualizationPreset(presetId: string) {
    const preset = VISUALIZATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const sample = getSampleDatabaseById(preset.databaseId);
    if (!sample) return;

    setIsRunning(true);
    setError("");
    setMessage("");

    await resetDatabase(dbRef.current);
    const loadResult = await execSqlScript(dbRef.current, sample.sql);

    if (!loadResult.success) {
      withViewTransition(() => {
        startUiTransition(() => {
          setRows([]);
          setError(simplifySqlError(loadResult.error ?? "Failed to load database."));
        });
      });
      setIsRunning(false);
      return;
    }

    clearQueryHistory(projectIdRef.current);

    withViewTransition(() => {
      startUiTransition(() => {
        setHistory([]);
        setSelectedText("");
        setQuery(preset.sql);
        setMessage(`Running ${preset.title}…`);
      });
    });

    await refreshSchema();

    const runResult = await runQuery(dbRef.current, preset.sql);
    await applyQueryResult(preset.sql, runResult, { saveHistory: true });
    setIsRunning(false);
  }

  function loadHistoryItem(item: string) {
    loadQuery(item);
  }

  return {
    query,
    setQuery,
    selectedText,
    setSelectedText,
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
    loadQuery,
    loadSampleDatabase,
    applyVisualizationPreset,
  };
}
