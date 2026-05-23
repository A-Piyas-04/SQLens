import AppHeader from "./components/layout/AppHeader";
import LoadingBanner from "./components/layout/LoadingBanner";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";
import SqlEditor from "./components/editor/SqlEditor";
import ResultTable from "./components/results/ResultTable";
import SchemaSidebar from "./components/schema/SchemaSidebar";
import QueryHistory from "./components/features/QueryHistory";
import QueryToolbar from "./components/features/QueryToolbar";
import StatusMessage from "./components/common/StatusMessage";
import Panel from "./components/common/Panel";
import ErdViewer from "./components/erd/ErdViewer";
import ProjectSwitcher from "./components/projects/ProjectSwitcher";
import { useActiveProject } from "./hooks/useActiveProject";
import { useResizablePanel } from "./hooks/useResizablePanel";
import { useSqlWorkspace } from "./hooks/useSqlWorkspace";

export default function App() {
  const { width, isResizing, onResizeStart } = useResizablePanel();

  const {
    projects,
    activeProject,
    db,
    createProject,
    renameProject,
    deleteProject,
    switchProject,
  } = useActiveProject();

  const workspace = useSqlWorkspace(db, activeProject?.id ?? "");

  const sidebar = (
    <div className="flex h-full flex-col gap-4">
      <ProjectSwitcher
        projects={projects}
        activeProject={activeProject}
        onCreate={createProject}
        onRename={renameProject}
        onDelete={deleteProject}
        onSwitch={switchProject}
      />

      <div className="h-px shrink-0 bg-slate-800/60" aria-hidden />

      <SchemaSidebar
        tables={workspace.tables}
        onRefresh={workspace.refreshSchema}
      />
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/25 via-slate-950 to-slate-950"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <AppHeader />

        <WorkspaceLayout
          sidebarWidth={width}
          isResizing={isResizing}
          onResizeStart={onResizeStart}
          sidebar={sidebar}
        >
          <SqlEditor
            value={workspace.query}
            onChange={workspace.setQuery}
            onSelectionChange={workspace.setSelectedText}
            onRun={workspace.handleRunQuery}
          />

          <QueryToolbar
            isRunning={workspace.isRunning}
            hasSelection={!!workspace.selectedText.trim()}
            onRun={workspace.handleRunQuery}
            onReset={workspace.handleResetDatabase}
          />

          <LoadingBanner isVisible={workspace.isRunning} />

          {workspace.error ? (
            <StatusMessage variant="error" message={workspace.error} />
          ) : null}

          {workspace.message ? (
            <StatusMessage variant="success" message={workspace.message} />
          ) : null}

          <QueryHistory
            items={workspace.history}
            onSelect={workspace.loadHistoryItem}
          />

          <ResultTable rows={workspace.rows} />

          <Panel title="Entity Relationship Diagram">
            <ErdViewer tables={workspace.tables} />
          </Panel>
        </WorkspaceLayout>
      </div>
    </div>
  );
}
