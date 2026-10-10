import { GitFork, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import ErdViewer from "../components/erd/ErdViewer";
import AppBootGate from "../components/layout/AppBootGate";
import Button from "../components/common/Button";
import { getDatabase } from "../lib/db/createDatabase";
import { getSchema, type SchemaTable } from "../lib/db/schema";
import { onTabMessage, postTabMessage, withDatabaseIfFree } from "../lib/db/tabLock";
import { resolveErdProjectId } from "../lib/erd/erdFullscreenUrl";
import { getProjects } from "../lib/projects/projectStore";

export default function ErdFullscreenPage() {
  const projectId = useMemo(
    () => resolveErdProjectId(window.location.search),
    []
  );
  const projectName =
    getProjects().find((project) => project.id === projectId)?.name ??
    "Project";

  const [tables, setTables] = useState<SchemaTable[]>([]);

  // This tab never owns the database: the workspace tab usually does, and two owners overwrite each other.
  const refreshSchema = useCallback(async () => {
    const schema = await withDatabaseIfFree(projectId, () =>
      getSchema(getDatabase(projectId))
    );
    if (schema) {
      setTables(schema);
    } else {
      postTabMessage({ type: "schema-request", dbId: projectId });
    }
  }, [projectId]);

  useEffect(
    () =>
      onTabMessage((message) => {
        if (message.type === "schema" && message.dbId === projectId) {
          setTables(message.tables);
        }
      }),
    [projectId]
  );

  useEffect(() => {
    void refreshSchema();
  }, [refreshSchema]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshSchema();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshSchema]);

  return (
    <AppBootGate>
      <div className="flex h-dvh min-h-0 flex-col bg-surface text-ink">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-surface-raised px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <GitFork className="size-4 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-medium">
                Entity Relationship Diagram
              </h1>
              <p className="truncate text-xs text-ink-muted">{projectName}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open workspace
          </Button>
        </header>

        <div className="min-h-0 flex-1 p-3 sm:p-4">
          <ErdViewer tables={tables} fullscreen />
        </div>
      </div>
    </AppBootGate>
  );
}
