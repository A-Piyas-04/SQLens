import { SQL50_DB_ID } from "../../features/sql50/types/sql50";
import { deleteAllSqlensDatabases } from "../db/createDatabase";
import {
  listLocalStorageKeys,
  safeGetLocalStorage,
  safeRemoveLocalStorage,
  safeSetLocalStorage,
} from "../storage/safeStorage";

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const PROJECTS_KEY = "sqlens-projects";
const ACTIVE_PROJECT_KEY = "sqlens-active-project";

export const historyKey = (id: string) => `sqlens-history-${id}`;
export const draftKey = (id: string) => `sqlens-draft-${id}`;

/** Drafts above this size still run; only automatic persistence is skipped. */
export const MAX_DRAFT_AUTOSAVE_CHARS = 500 * 1024;

/** Every localStorage key SQLens writes starts with one of these prefixes. */
const SQLENS_STORAGE_PREFIXES = ["sqlens-", "sqlens:", "simulator:", "sql50-"];

function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Project list ──────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  try {
    const raw = safeGetLocalStorage(PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]): void {
  safeSetLocalStorage(PROJECTS_KEY, JSON.stringify(projects));
}

// ─── Active project ────────────────────────────────────────────────────────

export function getActiveProjectId(): string | null {
  return safeGetLocalStorage(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string): void {
  safeSetLocalStorage(ACTIVE_PROJECT_KEY, id);
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export function createProject(name?: string): Project {
  const projects = getProjects();
  const resolvedName = name?.trim() || `Project ${projects.length + 1}`;
  const now = new Date().toISOString();
  const project: Project = {
    id: generateId(),
    name: resolvedName,
    createdAt: now,
    updatedAt: now,
  };
  saveProjects([...projects, project]);
  return project;
}

export function renameProject(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const projects = getProjects().map((p) =>
    p.id === id
      ? { ...p, name: trimmed, updatedAt: new Date().toISOString() }
      : p
  );
  saveProjects(projects);
}

/** Removes project metadata, draft, and history. The PGlite database is removed separately. */
export function deleteProject(id: string): void {
  saveProjects(getProjects().filter((p) => p.id !== id));
  safeRemoveLocalStorage(historyKey(id));
  safeRemoveLocalStorage(draftKey(id));
}

// ─── Per-project editor state ──────────────────────────────────────────────

export function getProjectDraft(id: string): string {
  return safeGetLocalStorage(draftKey(id)) ?? "";
}

export type DraftSaveResult = "saved" | "too-large" | "failed";

export function setProjectDraft(id: string, sql: string): DraftSaveResult {
  if (sql.length > MAX_DRAFT_AUTOSAVE_CHARS) return "too-large";
  return safeSetLocalStorage(draftKey(id), sql) ? "saved" : "failed";
}

export function getSqlensStorageKeys(): string[] {
  return listLocalStorageKeys().filter((key) =>
    SQLENS_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

/** Removes all SQLens localStorage data and every SQLens PGlite IndexedDB database. */
export async function clearAllLocalData(): Promise<void> {
  const projectIds = [...getProjects().map((project) => project.id), SQL50_DB_ID];

  for (const key of getSqlensStorageKeys()) {
    safeRemoveLocalStorage(key);
  }

  await deleteAllSqlensDatabases(projectIds);
}

// ─── Bootstrap ────────────────────────────────────────────────────────────

/** Called once on app start. Ensures at least one project exists and one is active. */
export function ensureDefaultProject(): Project {
  const projects = getProjects();

  if (projects.length > 0) {
    const activeId = getActiveProjectId();
    const active = projects.find((p) => p.id === activeId) ?? projects[0];
    setActiveProjectId(active.id);
    return active;
  }

  const first = createProject("My First Project");
  setActiveProjectId(first.id);
  return first;
}
