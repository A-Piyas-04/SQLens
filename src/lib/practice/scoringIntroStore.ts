import { safeGetLocalStorage, safeSetLocalStorage } from "../storage/safeStorage";

const SCORING_INTRO_SEEN_KEY = "sqlens-sql50-scoring-intro-seen";

export function hasSeenScoringIntro(): boolean {
  return safeGetLocalStorage(SCORING_INTRO_SEEN_KEY) === "1";
}

export function markScoringIntroSeen(): void {
  safeSetLocalStorage(SCORING_INTRO_SEEN_KEY, "1");
}
