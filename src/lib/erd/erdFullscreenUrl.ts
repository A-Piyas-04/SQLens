import {
  ensureDefaultProject,
  getActiveProjectId,
} from "../projects/projectStore";

export function buildErdFullscreenUrl(projectId: string): string {
  const url = new URL("/erd", window.location.origin);
  url.searchParams.set("project", projectId);
  return url.toString();
}

export function resolveErdProjectId(search: string): string {
  const params = new URLSearchParams(search);
  const fromQuery = params.get("project")?.trim();
  if (fromQuery) return fromQuery;

  return getActiveProjectId() ?? ensureDefaultProject().id;
}
