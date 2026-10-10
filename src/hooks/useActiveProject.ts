import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { deleteProjectDatabase } from "../lib/db/createDatabase";
import { isDatabaseOpenInAnotherTab } from "../lib/db/tabLock";
import {
  createProject,
  deleteProject as deleteProjectInStore,
  ensureDefaultProject,
  getProjects,
  PROJECTS_KEY,
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

  const syncProjects = useCallback(() => {
    setProjects(getProjects());
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === PROJECTS_KEY) syncProjects();
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [syncProjects]);

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
    async (id: string): Promise<void> => {
      if (await isDatabaseOpenInAnotherTab(id)) {
        toast.error("This project is open in another tab. Close it there first, then delete it.", {
          id: "sqlens-delete-open-elsewhere",
        });
        return;
      }

      const remaining = getProjects().filter((p) => p.id !== id);
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
    [activeProjectId, syncProjects]
  );

  return {
    projects,
    activeProject,
    activeProjectId,
    createProject: handleCreateProject,
    renameProject: handleRenameProject,
    switchProject: handleSwitchProject,
    deleteProject: handleDeleteProject,
  };
}
