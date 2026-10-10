import { ExternalLink, GraduationCap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import StatusMessage from "../components/common/StatusMessage";
import Button from "../components/common/Button";
import Skeleton from "../components/common/Skeleton";
import AppBootGate from "../components/layout/AppBootGate";
import HintPanel from "../features/sql50/components/HintPanel";
import ProblemHeader from "../features/sql50/components/ProblemHeader";
import ProblemStatement from "../features/sql50/components/ProblemStatement";
import ProblemStatementModal from "../features/sql50/components/ProblemStatementModal";
import ProgressPanel from "../features/sql50/components/ProgressPanel";
import SolutionModal from "../features/sql50/components/SolutionModal";
import Sql50ActionBar from "../features/sql50/components/Sql50ActionBar";
import Sql50EditorPanel from "../features/sql50/components/Sql50EditorPanel";
import Sql50LeftSidebar from "../features/sql50/components/Sql50LeftSidebar";
import Sql50PageLayout, {
  Sql50Workbench,
  Sql50WorkbenchEditor,
  Sql50WorkbenchMain,
  Sql50WorkbenchResults,
  Sql50WorkbenchTop,
} from "../features/sql50/components/Sql50PageLayout";
import Sql50ResultsPanel from "../features/sql50/components/Sql50ResultsPanel";
import Sql50SimulationModal from "../features/sql50/components/Sql50SimulationModal";
import SubmissionResultPanel from "../features/sql50/components/SubmissionResult";
import { useProblemProgress } from "../features/sql50/hooks/useProblemProgress";
import { useSql50 } from "../features/sql50/hooks/useSql50";
import { useSql50Simulation } from "../features/sql50/hooks/useSql50Simulation";
import { useSubmissionEngine } from "../features/sql50/hooks/useSubmissionEngine";
import { markSolutionViewed } from "../features/sql50/services/progressStore";
import { notifyProgressUpdate } from "../features/sql50/hooks/useProblemProgress";
import { PACK_ID } from "../features/sql50/services/progressStore";
import { cn } from "../lib/utils/cn";
import type { SqlEditorHandle } from "../components/editor/SqlEditor";

type MobileTab = "problems" | "schema" | "help";

export default function Sql50PracticePage() {
  const workspace = useSql50();
  const { analytics, getProblemProgress, toggleBookmark } = useProblemProgress();
  const simulation = useSql50Simulation(workspace.db);
  const {
    isPreparing: isPreparingSimulation,
    error: simulationError,
    simulation: simulationData,
    prepareSimulation,
    closeSimulation,
    clearError: clearSimulationError,
  } = simulation;
  const editorRef = useRef<SqlEditorHandle>(null);

  const [solutionOpen, setSolutionOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [acceptedScore, setAcceptedScore] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("problems");

  const progress = getProblemProgress(workspace.activeProblem.id);

  const { submit, isSubmitting, lastResult, clearResult } = useSubmissionEngine({
    db: workspace.db,
    onAccepted: (score) => setAcceptedScore(score),
  });

  const problemIndex = useMemo(
    () =>
      workspace.problems.findIndex((p) => p.id === workspace.activeProblem.id),
    [workspace.problems, workspace.activeProblem.id]
  );

  const hasSelection = workspace.selectedText.trim().length > 0;
  const runLabel = workspace.isRunning
    ? "Running…"
    : hasSelection
      ? "Run Selection"
      : "Run Query";

  const handleSubmit = useCallback(async () => {
    clearResult();
    setAcceptedScore(null);
    await submit(workspace.activeProblem, workspace.query);
  }, [clearResult, submit, workspace.activeProblem, workspace.query]);

  const handleUnlockHint = useCallback(() => {
    workspace.unlockHint();
    notifyProgressUpdate();
  }, [workspace]);

  const handleRevealSolution = useCallback(() => {
    if (!progress.solved) {
      markSolutionViewed(PACK_ID, workspace.activeProblem.id);
      notifyProgressUpdate();
    }
    setSolutionOpen(true);
  }, [progress.solved, workspace.activeProblem.id]);

  const handlePlaySimulation = useCallback(async () => {
    clearSimulationError();
    await prepareSimulation(workspace.query, workspace.selectedText);
  }, [clearSimulationError, prepareSimulation, workspace.query, workspace.selectedText]);

  const handleVisualize = useCallback(
    (sql: string) => {
      workspace.setQuery(sql);
      setSolutionOpen(false);
      void prepareSimulation(sql, "");
    },
    [workspace, prepareSimulation]
  );

  const actionBarProps = {
    runLabel,
    isRunning: workspace.isRunning,
    isSubmitting,
    lastRunSucceeded: workspace.lastRunSucceeded,
    isPreparingSimulation,
    onPlaySimulation: () => void handlePlaySimulation(),
    onRun: () => {
      clearSimulationError();
      void workspace.handleRunQuery();
    },
    onSubmit: () => void handleSubmit(),
    onReset: () => void workspace.handleResetProblemDb(),
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        void handleSubmit();
        return;
      }
      if (mod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleBookmark(workspace.activeProblem.id);
        return;
      }
      if (event.key === "[" && !mod) {
        event.preventDefault();
        workspace.goToPrevious();
        return;
      }
      if (event.key === "]" && !mod) {
        event.preventDefault();
        workspace.goToNext();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, toggleBookmark, workspace]);

  useEffect(() => {
    clearResult();
    setAcceptedScore(null);
    clearSimulationError();
    setStatementOpen(false);
    // Only reset when the active problem changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.activeProblem.id]);

  useEffect(() => {
    if (!workspace.isLoadingProblem) {
      editorRef.current?.focus();
    }
  }, [workspace.activeProblem.id, workspace.isLoadingProblem]);

  const helpPanel = (
    <div className="space-y-4">
      <ProgressPanel analytics={analytics} embedded />
      <HintPanel
        embedded
        hints={workspace.activeProblem.hints}
        hintsUsed={progress.hintsUsed}
        onUnlockHint={handleUnlockHint}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={handleRevealSolution}
      >
        Reveal Solution
      </Button>
    </div>
  );

  const leftSidebar = (
    <Sql50LeftSidebar
      problems={workspace.problems}
      activeSlug={workspace.activeProblem.slug}
      getProgress={getProblemProgress}
      onSelectProblem={(p) => void workspace.selectProblem(p)}
      tables={workspace.tables}
      onRefreshSchema={() => void workspace.refreshSchema()}
    />
  );

  return (
    <AppBootGate db={workspace.db} className="h-dvh">
      <Sql50PageLayout
        header={
          <header className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-retro-edge bg-surface-raised px-4 py-2.5 shadow-[0_3px_0_var(--color-border-strong)] sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <GraduationCap className="size-5 shrink-0 text-accent" aria-hidden />
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-semibold">
                  Practice SQL 50
                </h1>
                <p className="truncate text-xs text-ink-muted">
                  {analytics.solved}/{analytics.total} solved
                </p>
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
              Workspace
            </Button>
          </header>
        }
        left={leftSidebar}
        center={
          <Sql50Workbench>
            <Sql50WorkbenchTop>
              {workspace.isLoadingProblem ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <ProblemHeader
                    compact
                    problem={workspace.activeProblem}
                    bookmarked={progress.bookmarked}
                    onToggleBookmark={() =>
                      toggleBookmark(workspace.activeProblem.id)
                    }
                    onPrevious={workspace.goToPrevious}
                    onNext={workspace.goToNext}
                    hasPrevious={problemIndex > 0}
                    hasNext={problemIndex < workspace.problems.length - 1}
                    onViewStatement={() => setStatementOpen(true)}
                  />
                  <ProblemStatement
                    embedded
                    description={workspace.activeProblem.description}
                  />
                </>
              )}
              {workspace.loadError ? (
                <StatusMessage variant="error" message={workspace.loadError} />
              ) : null}
            </Sql50WorkbenchTop>

            <Sql50WorkbenchMain>
            <Sql50WorkbenchEditor
              actions={<Sql50ActionBar rail {...actionBarProps} />}
              mobileActions={<Sql50ActionBar {...actionBarProps} />}
            >
              {workspace.isLoadingProblem ? (
                <Skeleton className="h-full min-h-0 w-full" />
              ) : (
                <Sql50EditorPanel
                  ref={editorRef}
                  value={workspace.query}
                  onChange={workspace.setQuery}
                  onSelectionChange={workspace.setSelectedText}
                  onRun={() => void workspace.handleRunQuery()}
                  hasSelection={hasSelection}
                />
              )}
            </Sql50WorkbenchEditor>

            <Sql50WorkbenchResults>
              <Sql50ResultsPanel rows={workspace.rows}>
                {workspace.error ? (
                  <StatusMessage variant="error" message={workspace.error} />
                ) : null}
                {simulationError ? (
                  <StatusMessage variant="error" message={simulationError} />
                ) : null}
                {workspace.message && !lastResult && workspace.rows.length === 0 ? (
                  <StatusMessage variant="success" message={workspace.message} />
                ) : null}
                <SubmissionResultPanel result={lastResult} />
                {acceptedScore !== null && lastResult?.verdict === "accepted" ? (
                  <p className="text-[11px] text-success-ink">
                    Score: {acceptedScore}/100
                    {progress.bestScore > 0 &&
                    progress.bestScore !== acceptedScore
                      ? ` (best: ${progress.bestScore})`
                      : null}
                  </p>
                ) : null}
              </Sql50ResultsPanel>
            </Sql50WorkbenchResults>
            </Sql50WorkbenchMain>
          </Sql50Workbench>
        }
        right={helpPanel}
        mobilePanels={
          <div className="max-h-[40vh] overflow-hidden">
            <div
              className="retro-tablist"
              role="tablist"
              aria-label="Practice panels"
            >
              {(
                [
                  ["problems", "Problems"],
                  ["schema", "Schema"],
                  ["help", "Help"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mobileTab === id}
                  aria-controls={`sql50-mobile-${id}`}
                  id={`sql50-mobile-tab-${id}`}
                  onClick={() => setMobileTab(id)}
                  className={cn(
                    "retro-tab flex-1 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              className="h-[calc(40vh-2.5rem)] overflow-hidden"
              role="tabpanel"
              id={`sql50-mobile-${mobileTab}`}
              aria-labelledby={`sql50-mobile-tab-${mobileTab}`}
            >
              {mobileTab === "problems" || mobileTab === "schema" ? (
                <Sql50LeftSidebar
                  problems={workspace.problems}
                  activeSlug={workspace.activeProblem.slug}
                  getProgress={getProblemProgress}
                  onSelectProblem={(p) => void workspace.selectProblem(p)}
                  tables={workspace.tables}
                  onRefreshSchema={() => void workspace.refreshSchema()}
                  activeTab={mobileTab === "schema" ? "schema" : "problems"}
                  onTabChange={(tab) =>
                    setMobileTab(tab === "schema" ? "schema" : "problems")
                  }
                  hideTabBar
                />
              ) : (
                <div className="h-full overflow-y-auto p-3 scrollbar-thin">
                  {helpPanel}
                </div>
              )}
            </div>
          </div>
        }
      />

      {simulationData ? (
        <Sql50SimulationModal
          snapshots={simulationData.snapshots}
          diffs={simulationData.diffs}
          originalSql={simulationData.originalSql}
          onClose={closeSimulation}
        />
      ) : null}

      <ProblemStatementModal
        problem={workspace.activeProblem}
        isOpen={statementOpen}
        onClose={() => setStatementOpen(false)}
      />

      <SolutionModal
        problem={workspace.activeProblem}
        isOpen={solutionOpen}
        onClose={() => setSolutionOpen(false)}
        onVisualize={handleVisualize}
      />
    </AppBootGate>
  );
}
