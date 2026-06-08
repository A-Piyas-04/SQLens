import { useCallback, useEffect, useState } from "react";

import type { PracticeAnalytics, UserProblemProgress } from "../../../lib/practice/types";
import {
  getAllProgress,
  getProgress,
  getSql50Analytics,
  PACK_ID,
  toggleBookmark,
} from "../services/progressStore";

function notifyProgressUpdate(): void {
  window.dispatchEvent(new Event("sql50-progress-updated"));
}

export { notifyProgressUpdate };

export function useProblemProgress() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    function onUpdate() {
      setVersion((v) => v + 1);
    }

    function onStorage(event: StorageEvent) {
      if (event.key?.startsWith("sqlens-practice-")) {
        onUpdate();
      }
    }

    window.addEventListener("sql50-progress-updated", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("sql50-progress-updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const progressMap = getAllProgress(PACK_ID);
  const analytics: PracticeAnalytics = getSql50Analytics();

  const getProblemProgress = useCallback(
    (problemId: number): UserProblemProgress => {
      return progressMap[problemId] ?? getProgress(PACK_ID, problemId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version busts stale closures
    [progressMap, version]
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
