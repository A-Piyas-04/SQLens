import { useCallback, useSyncExternalStore } from "react";

import type { PracticeAnalytics, UserProblemProgress } from "../../../lib/practice/types";
import {
  getAllProgress,
  getProgress,
  getSql50Analytics,
  PACK_ID,
  toggleBookmark,
} from "../services/progressStore";

function subscribe(callback: () => void): () => void {
  function onStorage(event: StorageEvent) {
    if (event.key?.startsWith("sqlens-practice-")) {
      callback();
    }
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener("sql50-progress-updated", callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("sql50-progress-updated", callback);
  };
}

function notifyProgressUpdate(): void {
  window.dispatchEvent(new Event("sql50-progress-updated"));
}

export { notifyProgressUpdate };

export function useProblemProgress() {
  const progressMap = useSyncExternalStore(
    subscribe,
    () => getAllProgress(PACK_ID),
    () => getAllProgress(PACK_ID)
  );

  const analytics: PracticeAnalytics = useSyncExternalStore(
    subscribe,
    () => getSql50Analytics(),
    () => getSql50Analytics()
  );

  const getProblemProgress = useCallback(
    (problemId: number): UserProblemProgress => {
      return progressMap[problemId] ?? getProgress(PACK_ID, problemId);
    },
    [progressMap]
  );

  const handleToggleBookmark = useCallback((problemId: number) => {
    toggleBookmark(PACK_ID, problemId);
    notifyProgressUpdate();
  }, []);

  return {
    progressMap,
    analytics,
    getProblemProgress,
    toggleBookmark: handleToggleBookmark,
  };
}
