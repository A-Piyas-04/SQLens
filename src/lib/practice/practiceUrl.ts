export function buildPracticeUrl(
  packId: string,
  problemSlug?: string
): string {
  const url = new URL(`/practice/${packId}`, window.location.origin);
  if (problemSlug) {
    url.searchParams.set("problem", problemSlug);
  }
  return url.pathname + url.search;
}

export function resolveProblemSlug(
  search: string,
  fallbackSlug: string
): string {
  const params = new URLSearchParams(search);
  const fromQuery = params.get("problem")?.trim();
  return fromQuery || fallbackSlug;
}

export function syncProblemSlugInUrl(slug: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("problem", slug);
  window.history.replaceState({}, "", url.pathname + url.search);
}
