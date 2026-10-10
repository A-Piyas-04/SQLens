import { PGlite } from "@electric-sql/pglite";

// Module-level registry — one PGlite instance per project for the lifetime of the page.
// This prevents re-creating (and re-initialising) the same database on every render.
const registry = new Map<string, PGlite>();

// PGlite's IndexedDB backend stores `idb://<name>` in a database called `/pglite/<name>`.
const PGLITE_IDB_PREFIX = "/pglite/";
const SQLENS_DATA_DIR_PREFIX = "sqlens";
const LEGACY_DATA_DIR = "sqlens";

function dataDirFor(projectId: string): string {
  return `${SQLENS_DATA_DIR_PREFIX}-${projectId}`;
}

/**
 * Returns the PGlite instance for the given project, creating it on first access.
 * The existing legacy database `idb://sqlens` is preserved under the special id "legacy".
 */
export function getDatabase(projectId: string): PGlite {
  if (!registry.has(projectId)) {
    const name = `idb://${dataDirFor(projectId)}`;
    registry.set(projectId, new PGlite(name));
  }
  return registry.get(projectId)!;
}

/** Closes and forgets the instance; the next `getDatabase` reloads fresh state from IndexedDB. */
export async function closeDatabase(projectId: string): Promise<void> {
  await closeRegisteredDatabase(projectId);
}

async function closeRegisteredDatabase(projectId: string): Promise<void> {
  const db = registry.get(projectId);
  registry.delete(projectId);
  if (!db) return;
  try {
    await db.close();
  } catch {
    /* already closed or never finished opening */
  }
}

/** Resolves on success, error, or block so callers never hang on a stuck connection. */
function deleteIndexedDb(name: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve();
      return;
    }
    try {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Closes the project's PGlite instance and deletes its IndexedDB storage. */
export async function deleteProjectDatabase(projectId: string): Promise<void> {
  await closeRegisteredDatabase(projectId);
  await deleteIndexedDb(`${PGLITE_IDB_PREFIX}${dataDirFor(projectId)}`);
}

async function listSqlensIndexedDbNames(): Promise<string[]> {
  if (typeof indexedDB === "undefined" || typeof indexedDB.databases !== "function") {
    return [];
  }
  try {
    const databases = await indexedDB.databases();
    return databases
      .map((db) => db.name ?? "")
      .filter((name) => name.startsWith(`${PGLITE_IDB_PREFIX}${SQLENS_DATA_DIR_PREFIX}`));
  } catch {
    return [];
  }
}

/**
 * Deletes every SQLens PGlite database: open instances, the given known project ids
 * (for browsers without `indexedDB.databases()`), discovered databases, and the legacy store.
 */
export async function deleteAllSqlensDatabases(knownProjectIds: string[]): Promise<void> {
  const openIds = [...registry.keys()];
  await Promise.all(openIds.map((id) => closeRegisteredDatabase(id)));

  const names = new Set<string>([
    `${PGLITE_IDB_PREFIX}${LEGACY_DATA_DIR}`,
    ...[...openIds, ...knownProjectIds].map((id) => `${PGLITE_IDB_PREFIX}${dataDirFor(id)}`),
    ...(await listSqlensIndexedDbNames()),
  ]);

  await Promise.all([...names].map((name) => deleteIndexedDb(name)));
}
