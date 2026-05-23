const STORAGE_KEY = "sql-simulator-query-history";

export function getQueryHistory(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveQueryToHistory(query: string) {
  const existing = getQueryHistory();

  const updated = [
    query,
    ...existing.filter((item) => item !== query),
  ].slice(0, 10);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
