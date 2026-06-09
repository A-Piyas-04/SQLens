import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { getDatabase } from "../../../lib/db/createDatabase";
import { runQuery } from "../../../lib/db/query";
import { getSchema, type SchemaTable } from "../../../lib/db/schema";
import {
  resolveProblemSlug,
  syncProblemSlugInUrl,
} from "../../../lib/practice/practiceUrl";
import { simplifySqlError } from "../../../lib/sql/simplifyError";
import { withViewTransition } from "../../../lib/utils/viewTransition";
import {
  getDefaultProblem,
  getProblemBySlug,
  SQL50_PROBLEMS,
} from "../data/sql50";
import { loadProblem } from "../services/problemLoader";
import {
  getProgress,
  PACK_ID,
  recordHint,
  saveDraft,
  setActiveProblemSlug,
} from "../services/progressStore";
import { notifyProgressUpdate } from "./useProblemProgress";
import type { Sql50Problem } from "../types/sql50";
import { SQL50_DB_ID } from "../types/sql50";

const STARTER_TEMPLATE = (problem: Sql50Problem) =>
  `-- ${problem.title}\n-- Write your SQL below\n\nSELECT `;

export function useSql50() {
  const db = getDatabase(SQL50_DB_ID);
  const dbRef = useRef(db);
  dbRef.current = db;

  const initialSlug = resolveProblemSlug(
    window.location.search,
    getDefaultProblem().slug
  );
  const initialProblem =
    getProblemBySlug(initialSlug) ?? getDefaultProblem();

  const [activeProblem, setActiveProblem] =
    useState<Sql50Problem>(initialProblem);
  const [query, setQueryState] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [lastRunSucceeded, setLastRunSucceeded] = useState(false);
  const [, startUiTransition] = useTransition();

  const activeProblemRef = useRef(activeProblem);
  activeProblemRef.current = activeProblem;
  const loadGenerationRef = useRef(0);
  const loadQueueRef = useRef<Promise<void>>(Promise.resolve());

  const refreshSchema = useCallback(async () => {
    const schema = await getSchema(dbRef.current);
    withViewTransition(() => {
      startUiTransition(() => setTables(schema));
    });
  }, [startUiTransition]);

  const loadProblemIntoDb = useCallback(
    async (problem: Sql50Problem) => {
      const generation = ++loadGenerationRef.current;

      const runLoad = async () => {
        setIsLoadingProblem(true);
        setLoadError("");
        setError("");
        setMessage("");
        setRows([]);
        setLastRunSucceeded(false);

        const result = await loadProblem(dbRef.current, problem);
        if (generation !== loadGenerationRef.current) {
          return;
        }

        if (!result.success) {
          setLoadError(result.error ?? "Failed to load problem.");
          setIsLoadingProblem(false);
          return;
        }

        const progress = getProgress(PACK_ID, problem.id);
        const draft = progress.draftSql ?? STARTER_TEMPLATE(problem);

        withViewTransition(() => {
          startUiTransition(() => {
            setQueryState(draft);
            setSelectedText("");
          });
        });

        await refreshSchema();
        if (generation !== loadGenerationRef.current) {
          return;
        }

        setActiveProblemSlug(PACK_ID, problem.slug);
        syncProblemSlugInUrl(problem.slug);
        setIsLoadingProblem(false);
      };

      loadQueueRef.current = loadQueueRef.current.then(runLoad, runLoad);
      await loadQueueRef.current;
    },
    [refreshSchema, startUiTransition]
  );

  useEffect(() => {
    void loadProblemIntoDb(initialProblem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectProblem = useCallback(
    async (problem: Sql50Problem) => {
      if (problem.id === activeProblemRef.current.id) return;
      saveDraft(PACK_ID, activeProblemRef.current.id, query);
      setActiveProblem(problem);
      await loadProblemIntoDb(problem);
    },
    [loadProblemIntoDb, query]
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      saveDraft(PACK_ID, activeProblemRef.current.id, value);
      notifyProgressUpdate();
    },
    []
  );

  const handleRunQuery = useCallback(async () => {
    const sqlToRun = selectedText.trim() || query;
    setError("");
    setMessage("");
    setIsRunning(true);

    const result = await runQuery(dbRef.current, sqlToRun);

    if (result.success) {
      setLastRunSucceeded(true);
      withViewTransition(() => {
        startUiTransition(() => {
          setRows(result.rows);
          setMessage(result.message ?? "Query executed successfully.");
        });
      });
      await refreshSchema();
    } else {
      setLastRunSucceeded(false);
      withViewTransition(() => {
        startUiTransition(() => {
          setRows([]);
          setError(simplifySqlError(result.error ?? "Unknown error"));
        });
      });
    }
    setIsRunning(false);
  }, [query, selectedText, refreshSchema, startUiTransition]);

  const handleResetProblemDb = useCallback(async () => {
    await loadProblemIntoDb(activeProblemRef.current);
    setMessage("Problem database reset.");
  }, [loadProblemIntoDb]);

  const unlockHint = useCallback(() => {
    const problem = activeProblemRef.current;
    const progress = getProgress(PACK_ID, problem.id);
    if (progress.hintsUsed >= problem.hints.length) return null;
    recordHint(PACK_ID, problem.id);
    notifyProgressUpdate();
    return problem.hints[progress.hintsUsed];
  }, []);

  const goToAdjacentProblem = useCallback(
    (direction: -1 | 1) => {
      const idx = SQL50_PROBLEMS.findIndex(
        (p) => p.id === activeProblemRef.current.id
      );
      const next = SQL50_PROBLEMS[idx + direction];
      if (next) void selectProblem(next);
    },
    [selectProblem]
  );

  return {
    db,
    activeProblem,
    problems: SQL50_PROBLEMS,
    query,
    setQuery,
    selectedText,
    setSelectedText,
    rows,
    error,
    message,
    isRunning,
    isLoadingProblem,
    loadError,
    lastRunSucceeded,
    tables,
    refreshSchema,
    selectProblem,
    handleRunQuery,
    handleResetProblemDb,
    unlockHint,
    goToPrevious: () => goToAdjacentProblem(-1),
    goToNext: () => goToAdjacentProblem(1),
  };
}
