import { historyKey } from "../lib/projects/projectStore";

const MAX_HISTORY = 10;

export function getQueryHistory(projectId: string): string[] {
  try {
    const raw = localStorage.getItem(historyKey(projectId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveQueryToHistory(projectId: string, query: string): void {
  const existing = getQueryHistory(projectId);
  const updated = [query, ...existing.filter((item) => item !== query)].slice(
    0,
    MAX_HISTORY
  );
  localStorage.setItem(historyKey(projectId), JSON.stringify(updated));
}

export function clearQueryHistory(projectId: string): void {
  localStorage.removeItem(historyKey(projectId));
}
