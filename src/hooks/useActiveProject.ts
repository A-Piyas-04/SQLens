import { useCallback, useState } from "react";

import { deleteProjectDatabase, getDatabase } from "../lib/db/createDatabase";
import {
  createProject,
  deleteProject as deleteProjectInStore,
  ensureDefaultProject,
  getProjects,
  renameProject as renameProjectInStore,
  setActiveProjectId,
  type Project,
} from "../lib/projects/projectStore";

export function useActiveProject() {
  const [activeProjectId, setActiveProjectIdState] = useState<string>(() => {
    return ensureDefaultProject().id;
  });

  const [projects, setProjects] = useState<Project[]>(() => getProjects());

  // Always derived — never stale because activeProjectId is state
  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? projects[0];

  // PGlite instance is looked up (or created) synchronously from the registry
  const db = getDatabase(activeProjectId);

  const syncProjects = useCallback(() => {
    setProjects(getProjects());
  }, []);

  const handleCreateProject = useCallback(
    (name?: string): Project => {
      const project = createProject(name);
      setActiveProjectId(project.id);
      setActiveProjectIdState(project.id);
      syncProjects();
      return project;
    },
    [syncProjects]
  );

  const handleRenameProject = useCallback(
    (id: string, name: string): void => {
      renameProjectInStore(id, name);
      syncProjects();
    },
    [syncProjects]
  );

  const handleSwitchProject = useCallback((id: string): void => {
    setActiveProjectId(id);
    setActiveProjectIdState(id);
  }, []);

  const handleDeleteProject = useCallback(
    (id: string): void => {
      const remaining = projects.filter((p) => p.id !== id);
      deleteProjectInStore(id);

      if (id === activeProjectId) {
        if (remaining.length > 0) {
          const next = remaining[0];
          setActiveProjectId(next.id);
          setActiveProjectIdState(next.id);
        } else {
          // Deleted the last project — auto-create a fresh one
          const fresh = createProject("My First Project");
          setActiveProjectId(fresh.id);
          setActiveProjectIdState(fresh.id);
        }
      }

      syncProjects();

      // Deferred so the re-render onto the next project commits before the old
      // instance is closed; otherwise a render could re-open the deleted database.
      window.setTimeout(() => {
        void deleteProjectDatabase(id);
      }, 0);
    },
    [activeProjectId, projects, syncProjects]
  );

  return {
    projects,
    activeProject,
    activeProjectId,
    db,
    createProject: handleCreateProject,
    renameProject: handleRenameProject,
    switchProject: handleSwitchProject,
    deleteProject: handleDeleteProject,
  };
}
