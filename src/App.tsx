import { useRef, useState } from "react";

import OnboardingTour from "./components/onboarding/OnboardingTour";
import SimulateButton from "./components/simulator/SimulateButton";
import AppBootGate from "./components/layout/AppBootGate";
import AppHeader from "./components/layout/AppHeader";
import AppNotesModal from "./components/layout/AppNotesModal";
import LoadingBanner from "./components/layout/LoadingBanner";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";
import SqlEditor, { type SqlEditorHandle } from "./components/editor/SqlEditor";
import ResultTable from "./components/results/ResultTable";
import QueryHistory from "./components/features/QueryHistory";
import ImportSqlButton from "./components/features/ImportSqlButton";
import QueryToolbar from "./components/features/QueryToolbar";
import StatusMessage from "./components/common/StatusMessage";
import Panel from "./components/common/Panel";
import ErdViewer from "./components/erd/ErdViewer";
import ErdScrollButton from "./components/layout/ErdScrollButton";
import ProjectSwitcher from "./components/projects/ProjectSwitcher";
import PracticeSidebar from "./components/practice/PracticeSidebar";
import PracticeRadialMenu from "./components/practice/PracticeRadialMenu";
import Sql50HeaderButton from "./features/sql50/components/Sql50HeaderButton";
import type { PracticeCategoryId } from "./constants/practiceCategories";
import DatabaseInUseScreen from "./components/layout/DatabaseInUseScreen";
import Button from "./components/common/Button";
import { useActiveProject } from "./hooks/useActiveProject";
import { useDatabaseTabLock, useShareSchemaWithOtherTabs } from "./hooks/useDatabaseTabLock";
import { useOnboardingTour } from "./hooks/useOnboardingTour";
import { useResizablePanel } from "./hooks/useResizablePanel";
import { useSqlWorkspace } from "./hooks/useSqlWorkspace";
import { getDatabase } from "./lib/db/createDatabase";
import { countDatabasesOpenInOtherTabs } from "./lib/db/tabLock";
import { clearAllLocalData } from "./lib/projects/projectStore";

type ProjectState = ReturnType<typeof useActiveProject>;

export default function App() {
  const projectState = useActiveProject();
  const { projects, activeProject, activeProjectId, switchProject, createProject } = projectState;
  const lock = useDatabaseTabLock(activeProjectId);

  if (lock.status !== "held") {
    const others = projects.filter((project) => project.id !== activeProjectId);
    return (
      <DatabaseInUseScreen
        status={lock.status}
        subject={`"${activeProject?.name ?? "This project"}"`}
        onTakeOver={lock.takeOver}
      >
        <div className="space-y-2 border-t border-line pt-4">
          <p className="text-xs font-medium text-ink-muted">Or open a different project here:</p>
          <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
            {others.map((project) => (
              <Button
                key={project.id}
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => switchProject(project.id)}
              >
                {project.name}
              </Button>
            ))}
            <Button variant="ghost" size="sm" className="w-full" onClick={() => createProject()}>
              New project
            </Button>
          </div>
        </div>
      </DatabaseInUseScreen>
    );
  }

  return <Workspace key={activeProjectId} projectState={projectState} />;
}

/** Mounted only while this tab owns the active project's database. */
function Workspace({ projectState }: { projectState: ProjectState }) {
  const editorRef = useRef<SqlEditorHandle>(null);
  const { width, isResizing, onResizeStart } = useResizablePanel();

  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [practiceCategory, setPracticeCategory] = useState<PracticeCategoryId | null>(
    null
  );

  const {
    projects,
    activeProject,
    activeProjectId,
    createProject,
    renameProject,
    deleteProject,
    switchProject,
  } = projectState;

  const workspace = useSqlWorkspace(getDatabase(activeProjectId), activeProjectId);
  useShareSchemaWithOtherTabs(activeProjectId, workspace.tables);
  const onboarding = useOnboardingTour();
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

  async function handleClearLocalData() {
    if ((await countDatabasesOpenInOtherTabs()) > 0) {
      window.alert(
        "SQLens is open in another tab. Close the other SQLens tabs first, otherwise they would write their data back after it is cleared."
      );
      return;
    }
    const confirmed = window.confirm(
      "This will remove all local SQLens data on this browser (projects, their databases, drafts, query history, SQL50 progress, and preferences). Continue?"
    );
    if (!confirmed) return;
    await clearAllLocalData();
    window.location.reload();
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
        onClearLocalData={handleClearLocalData}
      />

      <div className="h-px shrink-0 bg-line" aria-hidden />

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
    <AppBootGate dbId={activeProjectId}>
    <div className="relative z-[1] min-h-screen overflow-x-hidden bg-surface text-ink">
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:48px_48px] opacity-40"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <AppHeader
          promo={<Sql50HeaderButton />}
          onOpenNotes={() => setNotesOpen(true)}
          onStartTour={onboarding.restart}
          actions={
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
          }
        />

        <AppNotesModal isOpen={notesOpen} onClose={() => setNotesOpen(false)} />

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
                <ImportSqlButton
                  disabled={workspace.isRunning}
                  currentQuery={workspace.query}
                  onImport={workspace.importSql}
                  onError={workspace.reportWorkspaceError}
                />
                <ErdScrollButton />
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,4fr)_minmax(0,1fr)] md:items-stretch">
            <ResultTable rows={workspace.rows} />
            <SimulateButton
              query={workspace.query}
              selectedText={workspace.selectedText}
              dbId={activeProjectId}
            />
          </div>

          <QueryHistory
            items={workspace.history}
            onSelect={workspace.loadHistoryItem}
          />

          <Panel
            id="erd-section"
            dataTour="erd-section"
            title="Entity Relationship Diagram"
            className="scroll-mt-6"
            raised
          >
            <ErdViewer
              tables={workspace.tables}
              projectId={activeProjectId}
            />
          </Panel>
        </WorkspaceLayout>

        <OnboardingTour
          isActive={onboarding.isActive}
          step={onboarding.step}
          stepIndex={onboarding.stepIndex}
          totalSteps={onboarding.totalSteps}
          isFirst={onboarding.isFirst}
          isLast={onboarding.isLast}
          onNext={onboarding.next}
          onBack={onboarding.back}
          onSkip={onboarding.skip}
        />
      </div>
    </div>
    </AppBootGate>
  );
}
