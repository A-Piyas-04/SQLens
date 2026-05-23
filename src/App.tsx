import { useRef, useState } from "react";

import AppHeader from "./components/layout/AppHeader";
import LoadingBanner from "./components/layout/LoadingBanner";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";
import SqlEditor, { type SqlEditorHandle } from "./components/editor/SqlEditor";
import ResultTable from "./components/results/ResultTable";
import QueryHistory from "./components/features/QueryHistory";
import QueryToolbar from "./components/features/QueryToolbar";
import StatusMessage from "./components/common/StatusMessage";
import Panel from "./components/common/Panel";
import ErdViewer from "./components/erd/ErdViewer";
import ErdScrollButton from "./components/layout/ErdScrollButton";
import ProjectSwitcher from "./components/projects/ProjectSwitcher";
import PracticeSidebar from "./components/practice/PracticeSidebar";
import PracticeRadialMenu from "./components/practice/PracticeRadialMenu";
import type { PracticeCategoryId } from "./constants/practiceCategories";
import { useActiveProject } from "./hooks/useActiveProject";
import { useResizablePanel } from "./hooks/useResizablePanel";
import { useSqlWorkspace } from "./hooks/useSqlWorkspace";

export default function App() {
  const editorRef = useRef<SqlEditorHandle>(null);
  const { width, isResizing, onResizeStart } = useResizablePanel();

  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);
  const [practiceCategory, setPracticeCategory] = useState<PracticeCategoryId | null>(
    null
  );

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
  const hasSelection = !!workspace.selectedText.trim();

  function handleTogglePracticeMenu() {
    setPracticeMenuOpen((open) => {
      if (open) setPracticeCategory(null);
      return !open;
    });
  }

  function handleSelectPracticeCategory(id: PracticeCategoryId | null) {
    setPracticeCategory(id);
  }

  function handleInsertSnippet(sql: string) {
    const needsSpace = sql.match(/^(INNER|LEFT|RIGHT|JOIN|GROUP|HAVING|ORDER|LIMIT)/i);
    const text = needsSpace ? ` ${sql}` : sql;
    editorRef.current?.insertAtCursor(text);
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ProjectSwitcher
        projects={projects}
        activeProject={activeProject}
        onCreate={createProject}
        onRename={renameProject}
        onDelete={deleteProject}
        onSwitch={switchProject}
      />

      <div className="h-px shrink-0 bg-slate-800/60" aria-hidden />

      <PracticeSidebar
        tables={workspace.tables}
        activeCategory={practiceCategory}
        onSelectCategory={handleSelectPracticeCategory}
        isLoading={workspace.isRunning}
        onRefreshSchema={workspace.refreshSchema}
        onLoadSampleDatabase={workspace.loadSampleDatabase}
        onLoadQuery={workspace.loadQuery}
        onApplyVisualizationPreset={workspace.applyVisualizationPreset}
        editorRef={editorRef}
      />
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/25 via-slate-950 to-slate-950"
        aria-hidden
      />

      <PracticeRadialMenu
        isOpen={practiceMenuOpen}
        activeCategory={practiceCategory}
        isLoading={workspace.isRunning}
        onToggle={handleTogglePracticeMenu}
        onSelectCategory={handleSelectPracticeCategory}
        onLoadSampleDatabase={workspace.loadSampleDatabase}
        onLoadQuery={workspace.loadQuery}
        onInsertSnippet={handleInsertSnippet}
        onApplyVisualizationPreset={workspace.applyVisualizationPreset}
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
            ref={editorRef}
            value={workspace.query}
            onChange={workspace.setQuery}
            onSelectionChange={workspace.setSelectedText}
            onRun={workspace.handleRunQuery}
            hasSelection={hasSelection}
            toolbar={
              <div className="flex items-center gap-2">
                <ErdScrollButton className="mr-10" />
                <QueryToolbar
                  variant="header"
                  isRunning={workspace.isRunning}
                  hasSelection={hasSelection}
                  onRun={workspace.handleRunQuery}
                  onReset={workspace.handleResetDatabase}
                />
              </div>
            }
          />

          <LoadingBanner isVisible={workspace.isRunning} />

          {workspace.error ? (
            <StatusMessage variant="error" message={workspace.error} />
          ) : null}

          {workspace.message ? (
            <StatusMessage variant="success" message={workspace.message} />
          ) : null}

          <ResultTable rows={workspace.rows} />

          <QueryHistory
            items={workspace.history}
            onSelect={workspace.loadHistoryItem}
          />

          <Panel
            id="erd-section"
            title="Entity Relationship Diagram"
            className="scroll-mt-6"
          >
            <ErdViewer tables={workspace.tables} />
          </Panel>
        </WorkspaceLayout>
      </div>
    </div>
  );
}
