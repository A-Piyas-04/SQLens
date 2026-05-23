import { PGlite } from "@electric-sql/pglite";

// Module-level registry — one PGlite instance per project for the lifetime of the page.
// This prevents re-creating (and re-initialising) the same database on every render.
const registry = new Map<string, PGlite>();

/**
 * Returns the PGlite instance for the given project, creating it on first access.
 * The existing legacy database `idb://sqlens` is preserved under the special id "legacy".
 */
export function getDatabase(projectId: string): PGlite {
  if (!registry.has(projectId)) {
    const name = `idb://sqlens-${projectId}`;
    registry.set(projectId, new PGlite(name));
  }
  return registry.get(projectId)!;
}
