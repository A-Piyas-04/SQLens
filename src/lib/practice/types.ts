export type PracticeDifficulty = "easy" | "medium" | "hard";

export interface PracticeProblem {
  id: number;
  slug: string;
  title: string;
  difficulty: PracticeDifficulty;
  topics: string[];
  description: string;
  schemaSql: string;
  seedSql: string;
  expectedOutputSql: string;
  hints: string[];
  explanation: string;
  officialSolution: string;
}

export interface ProblemPack {
  id: string;
  name: string;
  problems: PracticeProblem[];
}

export interface UserProblemProgress {
  problemId: number;
  solved: boolean;
  attempts: number;
  hintsUsed: number;
  bookmarked: boolean;
  solutionViewed: boolean;
  lastVisitedAt: string;
  bestScore: number;
  draftSql?: string;
}

export type SubmissionVerdict = "accepted" | "wrong_answer" | "runtime_error";

export interface ResultSetComparison {
  match: boolean;
  messages: string[];
}

export interface SubmissionResult {
  verdict: SubmissionVerdict;
  message: string;
  comparison?: ResultSetComparison;
  userRowCount?: number;
  expectedRowCount?: number;
}

export interface PracticeAnalytics {
  total: number;
  solved: number;
  byDifficulty: Record<
    PracticeDifficulty,
    { total: number; solved: number }
  >;
  topicsMastered: string[];
  topicsNeedingPractice: string[];
  averageBestScore: number;
}
