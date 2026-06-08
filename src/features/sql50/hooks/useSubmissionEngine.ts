import { useCallback, useState } from "react";

import { computeScore } from "../../../lib/practice/scoring";
import type { SubmissionResult } from "../../../lib/practice/types";
import { gradeSubmission } from "../services/submissionEngine";
import {
  getProgress,
  markSolved,
  PACK_ID,
  recordAttempt,
} from "../services/progressStore";
import { notifyProgressUpdate } from "./useProblemProgress";
import type { Sql50Problem } from "../types/sql50";

type Options = {
  db: import("@electric-sql/pglite").PGlite;
  onAccepted?: (score: number) => void;
};

export function useSubmissionEngine({ db, onAccepted }: Options) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);

  const submit = useCallback(
    async (problem: Sql50Problem, userSql: string) => {
      setIsSubmitting(true);
      setLastResult(null);

      const progressBefore = getProgress(PACK_ID, problem.id);
      recordAttempt(PACK_ID, problem.id);

      const result = await gradeSubmission(
        db,
        userSql,
        problem.expectedOutputSql
      );

      setLastResult(result);
      setIsSubmitting(false);

      if (result.verdict === "accepted") {
        const failedAttempts = progressBefore.solved
          ? 0
          : Math.max(0, progressBefore.attempts);
        const score = computeScore({
          hintsUsed: progressBefore.hintsUsed,
          failedAttempts,
          solutionViewedBeforeSolve:
            progressBefore.solutionViewed && !progressBefore.solved,
        });
        markSolved(PACK_ID, problem.id, score);
        onAccepted?.(score);
      }

      notifyProgressUpdate();
      return result;
    },
    [db, onAccepted]
  );

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    submit,
    isSubmitting,
    lastResult,
    clearResult,
  };
}
