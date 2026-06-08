import { clearOnboardingComplete } from "../onboarding/onboardingStore";
import { getAllPracticeStorageKeys } from "../practice/progressStore";

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
const SIMULATOR_SIDEBAR_WIDTH_KEY = "simulator:playbackSidebarWidth";
const SIMULATOR_SHOW_ROW_IDS_KEY = "simulator:showRowIds";
const SIMULATOR_DEBUG_KEY = "simulator:debug";

function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Project list ──────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// ─── Active project ────────────────────────────────────────────────────────

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
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

export function deleteProject(id: string): void {
  saveProjects(getProjects().filter((p) => p.id !== id));
  localStorage.removeItem(historyKey(id));
  localStorage.removeItem(draftKey(id));
}

// ─── Per-project editor state ──────────────────────────────────────────────

export function getProjectDraft(id: string): string {
  return localStorage.getItem(draftKey(id)) ?? "";
}

export function setProjectDraft(id: string, sql: string): void {
  localStorage.setItem(draftKey(id), sql);
}

export function clearAllLocalData(): void {
  const projects = getProjects();

  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(ACTIVE_PROJECT_KEY);

  for (const project of projects) {
    localStorage.removeItem(historyKey(project.id));
    localStorage.removeItem(draftKey(project.id));
  }

  localStorage.removeItem(SIMULATOR_SIDEBAR_WIDTH_KEY);
  localStorage.removeItem(SIMULATOR_SHOW_ROW_IDS_KEY);
  localStorage.removeItem(SIMULATOR_DEBUG_KEY);
  for (const key of getAllPracticeStorageKeys()) {
    localStorage.removeItem(key);
  }
  clearOnboardingComplete();
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
