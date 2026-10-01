import { historyKey } from "../lib/projects/projectStore";
import {
  safeGetLocalStorage,
  safeRemoveLocalStorage,
  safeSetLocalStorage,
} from "../lib/storage/safeStorage";

const MAX_HISTORY = 10;

/** Larger queries still run; they are just not kept in history. */
export const MAX_HISTORY_ITEM_CHARS = 100 * 1024;

export function getQueryHistory(projectId: string): string[] {
  try {
    const raw = safeGetLocalStorage(historyKey(projectId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveQueryToHistory(projectId: string, query: string): void {
  if (query.length > MAX_HISTORY_ITEM_CHARS) return;
  const existing = getQueryHistory(projectId);
  const updated = [query, ...existing.filter((item) => item !== query)].slice(
    0,
    MAX_HISTORY
  );
  safeSetLocalStorage(historyKey(projectId), JSON.stringify(updated));
}

export function clearQueryHistory(projectId: string): void {
  safeRemoveLocalStorage(historyKey(projectId));
}
