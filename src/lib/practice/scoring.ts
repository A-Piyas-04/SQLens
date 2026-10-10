export const BASE_SCORE = 100;
export const HINT_PENALTY = 10;
export const FAILED_ATTEMPT_PENALTY = 5;
export const SOLUTION_VIEWED_PENALTY = 20;

export function computeScore(options: {
  hintsUsed: number;
  failedAttempts: number;
  solutionViewedBeforeSolve: boolean;
}): number {
  const { hintsUsed, failedAttempts, solutionViewedBeforeSolve } = options;

  let score = BASE_SCORE;
  score -= hintsUsed * HINT_PENALTY;
  score -= failedAttempts * FAILED_ATTEMPT_PENALTY;
  if (solutionViewedBeforeSolve) {
    score -= SOLUTION_VIEWED_PENALTY;
  }

  return Math.max(0, Math.min(BASE_SCORE, score));
}

export function mergeBestScore(current: number, next: number): number {
  return Math.max(current, next);
}
