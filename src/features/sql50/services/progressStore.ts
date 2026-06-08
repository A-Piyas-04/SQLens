import {
  getAllProgress,
  getProgress,
  getAnalytics,
  toggleBookmark,
  recordAttempt,
  recordHint,
  markSolved,
  markSolutionViewed,
  saveDraft,
  getActiveProblemSlug,
  setActiveProblemSlug,
  updateProgress,
} from "../../../lib/practice/progressStore";
import { SQL50_PACK } from "../data/sql50";
import { SQL50_PACK_ID } from "../types/sql50";

export {
  getAllProgress,
  getProgress,
  getAnalytics,
  toggleBookmark,
  recordAttempt,
  recordHint,
  markSolved,
  markSolutionViewed,
  saveDraft,
  getActiveProblemSlug,
  setActiveProblemSlug,
  updateProgress,
};

export const PACK_ID = SQL50_PACK_ID;

export function getSql50Analytics() {
  return getAnalytics(SQL50_PACK);
}
