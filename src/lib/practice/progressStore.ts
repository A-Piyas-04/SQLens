import type {
  PracticeAnalytics,
  PracticeDifficulty,
  ProblemPack,
  UserProblemProgress,
} from "./types";
import { safeGetLocalStorage, safeSetLocalStorage } from "../storage/safeStorage";

const PROGRESS_KEY_PREFIX = "sqlens-practice-progress-";
const ACTIVE_KEY_PREFIX = "sqlens-practice-active-";

export function progressStorageKey(packId: string): string {
  return `${PROGRESS_KEY_PREFIX}${packId}`;
}

export function activeProblemStorageKey(packId: string): string {
  return `${ACTIVE_KEY_PREFIX}${packId}`;
}

export function getAllPracticeStorageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith(PROGRESS_KEY_PREFIX) || key.startsWith(ACTIVE_KEY_PREFIX))
    ) {
      keys.push(key);
    }
  }
  return keys;
}

function readProgressMap(packId: string): Record<number, UserProblemProgress> {
  try {
    const raw = localStorage.getItem(progressStorageKey(packId));
    return raw ? (JSON.parse(raw) as Record<number, UserProblemProgress>) : {};
  } catch {
    return {};
  }
}

function writeProgressMap(
  packId: string,
  map: Record<number, UserProblemProgress>
): void {
  safeSetLocalStorage(progressStorageKey(packId), JSON.stringify(map));
}

function defaultProgress(problemId: number): UserProblemProgress {
  return {
    problemId,
    solved: false,
    attempts: 0,
    hintsUsed: 0,
    bookmarked: false,
    solutionViewed: false,
    lastVisitedAt: new Date().toISOString(),
    bestScore: 0,
  };
}

export function getProgress(
  packId: string,
  problemId: number
): UserProblemProgress {
  const map = readProgressMap(packId);
  return map[problemId] ?? defaultProgress(problemId);
}

export function getAllProgress(
  packId: string
): Record<number, UserProblemProgress> {
  return readProgressMap(packId);
}

export function updateProgress(
  packId: string,
  problemId: number,
  patch: Partial<UserProblemProgress>
): UserProblemProgress {
  const map = readProgressMap(packId);
  const current = map[problemId] ?? defaultProgress(problemId);
  const next: UserProblemProgress = {
    ...current,
    ...patch,
    problemId,
    lastVisitedAt: new Date().toISOString(),
  };
  map[problemId] = next;
  writeProgressMap(packId, map);
  return next;
}

export function toggleBookmark(
  packId: string,
  problemId: number
): UserProblemProgress {
  const current = getProgress(packId, problemId);
  return updateProgress(packId, problemId, {
    bookmarked: !current.bookmarked,
  });
}

export function recordAttempt(
  packId: string,
  problemId: number
): UserProblemProgress {
  const current = getProgress(packId, problemId);
  return updateProgress(packId, problemId, {
    attempts: current.attempts + 1,
  });
}

export function recordHint(
  packId: string,
  problemId: number
): UserProblemProgress {
  const current = getProgress(packId, problemId);
  return updateProgress(packId, problemId, {
    hintsUsed: current.hintsUsed + 1,
  });
}

export function markSolved(
  packId: string,
  problemId: number,
  bestScore: number
): UserProblemProgress {
  const current = getProgress(packId, problemId);
  return updateProgress(packId, problemId, {
    solved: true,
    bestScore: Math.max(current.bestScore, bestScore),
  });
}

export function markSolutionViewed(
  packId: string,
  problemId: number
): UserProblemProgress {
  return updateProgress(packId, problemId, { solutionViewed: true });
}

export function saveDraft(
  packId: string,
  problemId: number,
  draftSql: string
): void {
  updateProgress(packId, problemId, { draftSql });
}

export function getActiveProblemSlug(packId: string): string | null {
  return safeGetLocalStorage(activeProblemStorageKey(packId));
}

export function setActiveProblemSlug(packId: string, slug: string): void {
  safeSetLocalStorage(activeProblemStorageKey(packId), slug);
}

const MASTERED_THRESHOLD = 0.8;
const NEEDS_PRACTICE_THRESHOLD = 0.5;

export function getAnalytics(pack: ProblemPack): PracticeAnalytics {
  const progressMap = readProgressMap(pack.id);
  const byDifficulty: Record<
    PracticeDifficulty,
    { total: number; solved: number }
  > = {
    easy: { total: 0, solved: 0 },
    medium: { total: 0, solved: 0 },
    hard: { total: 0, solved: 0 },
  };

  let solved = 0;
  let scoreSum = 0;
  let scoredCount = 0;

  const topicStats = new Map<
    string,
    { total: number; solved: number; attempted: number }
  >();

  for (const problem of pack.problems) {
    byDifficulty[problem.difficulty].total += 1;
    const p = progressMap[problem.id];
    if (p?.solved) {
      solved += 1;
      byDifficulty[problem.difficulty].solved += 1;
    }
    if (p && p.bestScore > 0) {
      scoreSum += p.bestScore;
      scoredCount += 1;
    }

    for (const topic of problem.topics) {
      const stat = topicStats.get(topic) ?? {
        total: 0,
        solved: 0,
        attempted: 0,
      };
      stat.total += 1;
      if (p?.solved) stat.solved += 1;
      if (p && (p.attempts > 0 || p.solved)) stat.attempted += 1;
      topicStats.set(topic, stat);
    }
  }

  const topicsMastered: string[] = [];
  const topicsNeedingPractice: string[] = [];

  for (const [topic, stat] of topicStats) {
    const rate = stat.total > 0 ? stat.solved / stat.total : 0;
    if (rate >= MASTERED_THRESHOLD) {
      topicsMastered.push(topic);
    } else if (rate < NEEDS_PRACTICE_THRESHOLD && stat.attempted > 0) {
      topicsNeedingPractice.push(topic);
    }
  }

  return {
    total: pack.problems.length,
    solved,
    byDifficulty,
    topicsMastered: topicsMastered.sort(),
    topicsNeedingPractice: topicsNeedingPractice.sort(),
    averageBestScore: scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0,
  };
}
