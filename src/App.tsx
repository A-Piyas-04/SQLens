import { useRef, useState } from "react";

import OnboardingTour from "./components/onboarding/OnboardingTour";
import AiSqlGeneratorPopover from "./components/ai/AiSqlGeneratorPopover";
import SimulatorPanel from "./components/simulator/SimulatorPanel";
import AppBootGate from "./components/layout/AppBootGate";
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
import { useOnboardingTour } from "./hooks/useOnboardingTour";
import { useResizablePanel } from "./hooks/useResizablePanel";
import { useSqlWorkspace } from "./hooks/useSqlWorkspace";
import { clearAllLocalData } from "./lib/projects/projectStore";

export default function App() {
  const editorRef = useRef<SqlEditorHandle>(null);
  const { width, isResizing, onResizeStart } = useResizablePanel();

  const [aiMenuOpen, setAiMenuOpen] = useState(false);
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
  const onboarding = useOnboardingTour();
  const hasSelection = !!workspace.selectedText.trim();

  function handleToggleAiMenu() {
    setAiMenuOpen((open) => !open);
    if (!aiMenuOpen) {
      setPracticeMenuOpen(false);
      setPracticeCategory(null);
    }
  }

  function handleTogglePracticeMenu() {
    setPracticeMenuOpen((open) => {
      if (open) setPracticeCategory(null);
      return !open;
    });
    if (!practiceMenuOpen) setAiMenuOpen(false);
  }

  function handleSelectPracticeCategory(id: PracticeCategoryId | null) {
    setPracticeCategory(id);
  }

  function handleInsertSnippet(sql: string) {
    const needsSpace = sql.match(/^(INNER|LEFT|RIGHT|JOIN|GROUP|HAVING|ORDER|LIMIT)/i);
    const text = needsSpace ? ` ${sql}` : sql;
    editorRef.current?.insertAtCursor(text);
  }

  function handleClearLocalData() {
    const confirmed = window.confirm(
      "This will remove all local SQLens data on this browser (projects, drafts, query history, and simulator preferences). Continue?"
    );
    if (!confirmed) return;
    clearAllLocalData();
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
    <AppBootGate db={db}>
    <div className="relative z-[1] min-h-screen overflow-x-hidden bg-surface text-ink">
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:48px_48px] opacity-40"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <AppHeader
          onStartTour={onboarding.restart}
          actions={
            <>
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
              <AiSqlGeneratorPopover
                isOpen={aiMenuOpen}
                onToggle={handleToggleAiMenu}
                onApplySql={workspace.loadQuery}
                disabled={workspace.isRunning}
              />
            </>
          }
        />

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

          <ResultTable rows={workspace.rows} />

          <SimulatorPanel
            query={workspace.query}
            selectedText={workspace.selectedText}
            db={db}
          />

          <QueryHistory
            items={workspace.history}
            onSelect={workspace.loadHistoryItem}
          />

          <Panel
            id="erd-section"
            dataTour="erd-section"
            title="Entity Relationship Diagram"
            className="scroll-mt-6"
          >
            <ErdViewer tables={workspace.tables} />
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
